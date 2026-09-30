"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helperService = exports.HelperService = void 0;
const db_1 = require("../database/db");
const errors_1 = require("../common/errors");
class HelperService {
    async listHelpers(ngoId) {
        const rows = await (0, db_1.query)(`SELECT id, name, phone, area_label as areaLabel, photo_url as photoUrl, active,
              ST_Latitude(home_location) as latitude, ST_Longitude(home_location) as longitude,
              (SELECT COUNT(*) FROM assignments a WHERE a.helper_id = helpers.id AND a.status IN ('ASSIGNED', 'IN_PROGRESS')) as activeAssignments
       FROM helpers
       WHERE ngo_id = ? AND active = TRUE
       ORDER BY name ASC`, [ngoId]);
        return rows.map((h) => ({
            ...h,
            latitude: Number(h.latitude),
            longitude: Number(h.longitude),
            active: !!h.active,
            activeAssignments: Number(h.activeAssignments),
        }));
    }
    async createHelper(ngoId, dto) {
        const result = await (0, db_1.execute)(`INSERT INTO helpers (ngo_id, name, phone, home_location, area_label, active, photo_url, created_at, updated_at)
       VALUES (?, ?, ?, ST_GeomFromText(?, 4326, 'axis-order=lat-long'), ?, TRUE, ?, NOW(), NOW())`, [
            ngoId,
            dto.name,
            dto.phone,
            `POINT(${dto.latitude} ${dto.longitude})`,
            dto.areaLabel || null,
            dto.photoUrl || null,
        ]);
        return {
            id: result.insertId,
            name: dto.name,
            message: 'Helper created successfully',
        };
    }
    async updateHelper(ngoId, helperId, dto) {
        const existing = await (0, db_1.query)('SELECT id FROM helpers WHERE id = ? AND ngo_id = ? LIMIT 1', [helperId, ngoId]);
        if (existing.length === 0)
            throw errors_1.AppError.notFound('Helper not found');
        const updates = ['updated_at = NOW()'];
        const params = [];
        if (dto.name) {
            updates.push('name = ?');
            params.push(dto.name);
        }
        if (dto.phone) {
            updates.push('phone = ?');
            params.push(dto.phone);
        }
        if (dto.latitude !== undefined && dto.longitude !== undefined) {
            updates.push("home_location = ST_GeomFromText(?, 4326, 'axis-order=lat-long')");
            params.push(`POINT(${dto.latitude} ${dto.longitude})`);
        }
        if (dto.areaLabel !== undefined) {
            updates.push('area_label = ?');
            params.push(dto.areaLabel);
        }
        if (dto.photoUrl !== undefined) {
            updates.push('photo_url = ?');
            params.push(dto.photoUrl);
        }
        params.push(helperId, ngoId);
        await (0, db_1.execute)(`UPDATE helpers SET ${updates.join(', ')} WHERE id = ? AND ngo_id = ?`, params);
        return { success: true, message: 'Helper updated successfully' };
    }
    async deleteHelper(ngoId, helperId) {
        const existing = await (0, db_1.query)('SELECT id FROM helpers WHERE id = ? AND ngo_id = ? LIMIT 1', [helperId, ngoId]);
        if (existing.length === 0)
            throw errors_1.AppError.notFound('Helper not found');
        // Soft delete via active = false
        await (0, db_1.execute)('UPDATE helpers SET active = FALSE, updated_at = NOW() WHERE id = ? AND ngo_id = ?', [
            helperId,
            ngoId,
        ]);
        return { success: true, message: 'Helper deactivated successfully' };
    }
}
exports.HelperService = HelperService;
exports.helperService = new HelperService();
