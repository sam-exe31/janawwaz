"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestService = exports.RequestService = void 0;
const db_1 = require("../database/db");
const config_1 = require("../config");
const errors_1 = require("../common/errors");
const utils_1 = require("../common/utils");
const storageService_1 = require("../storage/storageService");
const screeningService_1 = require("../screening/screeningService");
class RequestService {
    async submitRequest(citizenId, dto) {
        // 1. Validate Geo Bounding Box
        if (!(0, utils_1.isWithinGeoBBox)(dto.latitude, dto.longitude)) {
            throw errors_1.AppError.badRequest(`Coordinates (${dto.latitude}, ${dto.longitude}) lie outside the supported boundary box.`);
        }
        // 2. Text sanitization
        let cleanDescription = dto.description ? (0, utils_1.sanitizeText)(dto.description) : null;
        if (cleanDescription && (0, utils_1.isRepeatedChars)(cleanDescription)) {
            throw errors_1.AppError.badRequest('Description cannot consist only of repeated characters.');
        }
        // 3. Category verification
        const categories = await (0, db_1.query)('SELECT id, name, base_priority FROM categories WHERE id = ? AND active = TRUE LIMIT 1', [dto.categoryId]);
        if (categories.length === 0) {
            throw errors_1.AppError.badRequest('Selected category is invalid or inactive.');
        }
        return (0, db_1.withTransaction)(async (conn) => {
            // 4. Rate limit check: Max requests per day in Asia/Kolkata
            const todayKolkata = (0, utils_1.getTodayInKolkata)();
            const [limitRows] = await conn.query(`SELECT COUNT(*) as countToday FROM requests 
         WHERE citizen_id = ? 
           AND DATE(CONVERT_TZ(created_at, '+00:00', ?)) = ?`, [citizenId, config_1.config.server.timezone, todayKolkata]);
            if (limitRows[0].countToday >= config_1.config.citizen.maxRequestsPerDay) {
                throw new errors_1.AppError(429, 'RATE_LIMIT_EXCEEDED', `Daily submission limit reached. Citizens can submit at most ${config_1.config.citizen.maxRequestsPerDay} requests per day.`);
            }
            // 5. Cooldown check: 10 minutes between submissions
            const [recentRows] = await conn.query(`SELECT created_at FROM requests WHERE citizen_id = ? ORDER BY created_at DESC LIMIT 1`, [citizenId]);
            if (recentRows.length > 0) {
                const lastCreated = (0, utils_1.parseUtcDate)(recentRows[0].created_at);
                const diffMinutes = (Date.now() - lastCreated.getTime()) / (60 * 1000);
                if (diffMinutes < config_1.config.citizen.cooldownMinutes) {
                    const remainingMinutes = Math.ceil(config_1.config.citizen.cooldownMinutes - diffMinutes);
                    throw new errors_1.AppError(429, 'RATE_LIMIT_EXCEEDED', `Submission cooldown active. Please wait ${remainingMinutes} more minute(s) before submitting another report.`);
                }
            }
            // 6. Photo & Voice resolution
            let finalInputType = dto.inputType;
            const photoUploadIds = dto.photoUploadIds || [];
            const photosToAttach = [];
            for (const uploadId of photoUploadIds) {
                const meta = storageService_1.activeUploads.get(uploadId);
                if (!meta) {
                    throw errors_1.AppError.badRequest(`Uploaded photo id ${uploadId} not found or expired.`);
                }
                photosToAttach.push(meta);
            }
            let voiceUrl = null;
            if (dto.voiceUploadId) {
                const voiceMeta = storageService_1.activeUploads.get(dto.voiceUploadId);
                if (!voiceMeta) {
                    throw errors_1.AppError.badRequest(`Uploaded voice id ${dto.voiceUploadId} not found or expired.`);
                }
                voiceUrl = voiceMeta.url;
            }
            // Downgrade GEOTAGGED_PHOTO if any photo lacks EXIF GPS
            if (finalInputType === 'GEOTAGGED_PHOTO') {
                const hasGps = photosToAttach.some((p) => p.exifLat !== null && p.exifLng !== null);
                if (!hasGps) {
                    finalInputType = 'PHOTO';
                }
            }
            // 7. Insert request row
            const [insertResult] = await conn.query(`INSERT INTO requests (
          citizen_id, category_id, input_type, source, description,
          location, latitude, longitude, address_text, status,
          voice_url, caller_phone_verified, created_at, updated_at
        ) VALUES (
          ?, ?, ?, 'WEB', ?,
          ST_GeomFromText(?, 4326, 'axis-order=lat-long'), ?, ?, ?, 'SUBMITTED',
          ?, TRUE, NOW(), NOW()
        )`, [
                citizenId,
                dto.categoryId,
                finalInputType,
                cleanDescription,
                `POINT(${dto.latitude} ${dto.longitude})`,
                dto.latitude,
                dto.longitude,
                dto.addressText || null,
                voiceUrl,
            ]);
            const requestId = insertResult.insertId;
            // 8. Insert request_photos
            for (const p of photosToAttach) {
                await conn.query(`INSERT INTO request_photos (
            request_id, uploaded_by, kind, url, mime_type, size_bytes,
            exif_lat, exif_lng, exif_taken_at, sha256, created_at
          ) VALUES (?, ?, 'CITIZEN', ?, ?, ?, ?, ?, ?, ?, NOW())`, [
                    requestId,
                    citizenId,
                    p.url,
                    p.mimeType,
                    p.sizeBytes,
                    p.exifLat,
                    p.exifLng,
                    p.exifTakenAt,
                    p.sha256,
                ]);
            }
            // 9. Append initial status history
            await conn.query(`INSERT INTO request_status_history (request_id, from_status, to_status, actor_id, actor_role, note, created_at)
         VALUES (?, NULL, 'SUBMITTED', ?, 'CITIZEN', 'Citizen submitted civic report', NOW())`, [requestId, citizenId]);
            // 10. Append audit log
            await conn.query(`INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, after_json, created_at)
         VALUES (?, 'CITIZEN', 'CREATE_REQUEST', 'REQUEST', ?, ?, NOW())`, [
                citizenId,
                requestId,
                JSON.stringify({
                    categoryId: dto.categoryId,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    status: 'SUBMITTED',
                }),
            ]);
            // Trigger screening pipeline asynchronously (Phase 3)
            setImmediate(() => {
                screeningService_1.screeningService.processRequest(requestId).catch((err) => {
                    console.error(`[Screening] Error processing request #${requestId}:`, err);
                });
            });
            return {
                id: requestId,
                status: 'SUBMITTED',
                message: 'Request submitted successfully and queued for screening.',
            };
        });
    }
    async getCitizenRequests(citizenId, page = 0, size = 20) {
        const offset = page * size;
        const items = await (0, db_1.query)(`SELECT r.id, r.category_id as categoryId, c.name as categoryName,
              r.status, r.input_type as inputType, r.description,
              r.latitude, r.longitude, r.address_text as addressText,
              r.final_priority as finalPriority, r.created_at as createdAt,
              r.closed_at as closedAt
       FROM requests r
       JOIN categories c ON r.category_id = c.id
       WHERE r.citizen_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`, [citizenId, size, offset]);
        const countRows = await (0, db_1.query)('SELECT COUNT(*) as total FROM requests WHERE citizen_id = ?', [citizenId]);
        return {
            items,
            total: Number(countRows[0].total),
        };
    }
    async getRequestById(requestId, caller) {
        const rows = await (0, db_1.query)(`SELECT r.*, c.name as categoryName, c.slug as categorySlug,
              u.name as citizenName, u.phone as citizenPhone
       FROM requests r
       JOIN categories c ON r.category_id = c.id
       JOIN users u ON r.citizen_id = u.id
       WHERE r.id = ? LIMIT 1`, [requestId]);
        if (rows.length === 0) {
            throw errors_1.AppError.notFound(`Request #${requestId} not found`);
        }
        const req = rows[0];
        // Phone masking: Only owner and Admin see real phone number
        const canSeeRealPhone = caller.role === 'ADMIN' || caller.id === req.citizen_id;
        const citizenPhone = canSeeRealPhone ? req.citizenPhone : (0, utils_1.maskPhone)(req.citizenPhone);
        // Photos
        const photos = await (0, db_1.query)(`SELECT id, kind, url, mime_type as mimeType, size_bytes as sizeBytes,
              exif_lat as exifLat, exif_lng as exifLng, exif_taken_at as exifTakenAt,
              created_at as createdAt
       FROM request_photos
       WHERE request_id = ?`, [requestId]);
        return {
            id: req.id,
            citizenId: req.citizen_id,
            citizenName: req.citizenName,
            citizenPhone,
            categoryId: req.category_id,
            categoryName: req.categoryName,
            categorySlug: req.categorySlug,
            inputType: req.input_type,
            source: req.source,
            description: req.description,
            aiSummary: req.ai_summary,
            latitude: Number(req.latitude),
            longitude: Number(req.longitude),
            addressText: req.address_text,
            status: req.status,
            clusterId: req.cluster_id,
            isClusterParent: !!req.is_cluster_parent,
            finalPriority: req.final_priority ? Number(req.final_priority) : null,
            aiBudgetMin: req.ai_budget_min ? Number(req.ai_budget_min) : null,
            aiBudgetMax: req.ai_budget_max ? Number(req.ai_budget_max) : null,
            approvedBudget: req.approved_budget ? Number(req.approved_budget) : null,
            voiceUrl: req.voice_url,
            escalatedAt: req.escalated_at,
            closedAt: req.closed_at,
            createdAt: req.created_at,
            photos,
        };
    }
    async getRequestHistory(requestId) {
        const history = await (0, db_1.query)(`SELECT h.id, h.from_status as fromStatus, h.to_status as toStatus,
              h.actor_role as actorRole, h.note, h.created_at as createdAt,
              u.name as actorName
       FROM request_status_history h
       LEFT JOIN users u ON h.actor_id = u.id
       WHERE h.request_id = ?
       ORDER BY h.created_at ASC, h.id ASC`, [requestId]);
        return history;
    }
}
exports.RequestService = RequestService;
exports.requestService = new RequestService();
