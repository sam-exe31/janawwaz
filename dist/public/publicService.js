"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicService = exports.PublicService = void 0;
const db_1 = require("../database/db");
const utils_1 = require("../common/utils");
class PublicService {
    async recordVisit(hasVisitedToday) {
        const today = (0, utils_1.getTodayInKolkata)();
        if (!hasVisitedToday) {
            // Deduplicated increment
            await (0, db_1.execute)(`INSERT INTO site_visits (visit_date, count)
         VALUES (?, 1)
         ON DUPLICATE KEY UPDATE count = count + 1`, [today]);
        }
        const rows = await (0, db_1.query)('SELECT count FROM site_visits WHERE visit_date = ? LIMIT 1', [
            today,
        ]);
        return {
            recorded: !hasVisitedToday,
            count: rows.length > 0 ? rows[0].count : 0,
        };
    }
    async getCategories() {
        return (0, db_1.query)(`SELECT id, name, slug, base_priority as basePriority, 
              expected_resolution_hours as expectedResolutionHours,
              typical_budget_min as typicalBudgetMin,
              typical_budget_max as typicalBudgetMax
       FROM categories 
       WHERE active = TRUE 
       ORDER BY base_priority DESC, name ASC`);
    }
    async getLeaderboard(period = 'ALL') {
        // Exclude soft-deleted and unverified NGOs
        const rows = await (0, db_1.query)(`SELECT n.id, n.name, n.logo_url as logoUrl, n.area_label as areaLabel,
              n.rank_score as rankScore, n.total_completed as totalCompleted,
              n.avg_rating as avgRating, n.avg_resolution_hours as avgResolutionHours
       FROM ngos n
       WHERE n.deleted_at IS NULL AND n.verified = TRUE AND n.deactivated_at IS NULL
       ORDER BY n.rank_score DESC, n.total_completed DESC`);
        return rows.map((ngo, index) => ({
            rank: index + 1,
            ...ngo,
            rankScore: Number(ngo.rankScore),
            avgRating: Number(ngo.avgRating),
            avgResolutionHours: Number(ngo.avgResolutionHours),
        }));
    }
    async getNgoPublicProfile(ngoId) {
        const ngos = await (0, db_1.query)(`SELECT n.id, n.name, n.description, n.logo_url as logoUrl, n.area_label as areaLabel,
              n.contact_phone as contactPhone, n.service_radius_km as serviceRadiusKm,
              n.rank_score as rankScore, n.total_completed as totalCompleted,
              n.avg_rating as avgRating, n.avg_resolution_hours as avgResolutionHours,
              n.verified, n.created_at as createdAt
       FROM ngos n
       WHERE n.id = ? AND n.deleted_at IS NULL LIMIT 1`, [ngoId]);
        if (ngos.length === 0) {
            return null;
        }
        const ngo = ngos[0];
        // Compute leaderboard rank position
        const rankRows = await (0, db_1.query)(`SELECT COUNT(*) + 1 as rankPosition
       FROM ngos
       WHERE deleted_at IS NULL AND verified = TRUE AND deactivated_at IS NULL
         AND rank_score > ?`, [ngo.rankScore]);
        // Get recent completed work (last 5 closed requests handled by this NGO)
        const recentWork = await (0, db_1.query)(`SELECT r.id, r.ai_summary as summary, r.address_text as addressText,
              r.closed_at as closedAt, c.name as categoryName
       FROM requests r
       JOIN categories c ON r.category_id = c.id
       JOIN ngo_claims cl ON cl.request_id = r.id
       WHERE cl.ngo_id = ? AND r.status = 'CLOSED'
       ORDER BY r.closed_at DESC LIMIT 5`, [ngoId]);
        return {
            ...ngo,
            rankScore: Number(ngo.rankScore),
            avgRating: Number(ngo.avgRating),
            avgResolutionHours: Number(ngo.avgResolutionHours),
            leaderboardPosition: rankRows.length > 0 ? Number(rankRows[0].rankPosition) : null,
            recentCompletedWork: recentWork,
        };
    }
    async getStats() {
        const [counts] = await (0, db_1.query)(`
      SELECT 
        COUNT(*) as totalRequests,
        SUM(CASE WHEN status IN ('COMPLETED', 'CLOSED') THEN 1 ELSE 0 END) as resolvedRequests,
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as openRequests,
        SUM(CASE WHEN status IN ('CLAIMED', 'ASSIGNED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as inProgressRequests
      FROM requests
    `);
        const [ngoCounts] = await (0, db_1.query)(`
      SELECT COUNT(*) as activeNgos, AVG(avg_resolution_hours) as avgHours
      FROM ngos 
      WHERE deleted_at IS NULL AND verified = TRUE AND deactivated_at IS NULL
    `);
        const [visitCounts] = await (0, db_1.query)(`
      SELECT COALESCE(SUM(count), 0) as totalVisits FROM site_visits
    `);
        return {
            totalRequests: Number(counts?.totalRequests || 0),
            resolvedRequests: Number(counts?.resolvedRequests || 0),
            openRequests: Number(counts?.openRequests || 0),
            inProgressRequests: Number(counts?.inProgressRequests || 0),
            activeNgos: Number(ngoCounts?.activeNgos || 0),
            avgResolutionHours: Math.round(Number(ngoCounts?.avgHours || 24)),
            siteVisits: Number(visitCounts?.totalVisits || 0),
            coverageCity: 'Pune Metropolitan Region',
        };
    }
    async getPublicFeed(categorySlug, limit = 20) {
        let sql = `
      SELECT 
        r.id, r.description, r.ai_summary as aiSummary, r.status,
        r.latitude, r.longitude, r.address_text as addressText,
        r.final_priority as finalPriority, r.created_at as createdAt, r.closed_at as closedAt,
        c.name as categoryName, c.slug as categorySlug,
        n.name as claimedNgoName,
        CONCAT(SUBSTRING(COALESCE(u.name, 'Citizen'), 1, 2), '***') as reporterMaskedName
      FROM requests r
      JOIN categories c ON r.category_id = c.id
      JOIN users u ON r.citizen_id = u.id
      LEFT JOIN ngo_claims cl ON cl.request_id = r.id AND cl.active_key IS NOT NULL
      LEFT JOIN ngos n ON cl.ngo_id = n.id
      WHERE r.status NOT IN ('SUBMITTED', 'SCREENING', 'REJECTED_FAKE')
    `;
        const params = [];
        if (categorySlug && categorySlug !== 'all') {
            sql += ' AND c.slug = ?';
            params.push(categorySlug);
        }
        sql += ' ORDER BY r.created_at DESC LIMIT ?';
        params.push(Number(limit) || 20);
        const requests = await (0, db_1.query)(sql, params);
        // Fetch primary photos
        const reqIds = requests.map(r => r.id);
        let photosByReq = {};
        if (reqIds.length > 0) {
            const photos = await (0, db_1.query)(`SELECT request_id, kind, url FROM request_photos WHERE request_id IN (${reqIds.map(() => '?').join(',')})`, reqIds);
            photos.forEach(p => {
                if (!photosByReq[p.request_id])
                    photosByReq[p.request_id] = [];
                photosByReq[p.request_id].push({ kind: p.kind, url: p.url });
            });
        }
        return requests.map(r => ({
            ...r,
            photos: photosByReq[r.id] || [],
        }));
    }
}
exports.PublicService = PublicService;
exports.publicService = new PublicService();
