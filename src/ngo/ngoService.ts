import { PoolConnection } from 'mysql2/promise';
import { query, execute, withTransaction } from '../database/db';
import { config } from '../config';
import { AppError } from '../common/errors';
import { getTodayInKolkata } from '../common/utils';
import { requestStateMachine } from '../request/requestStateMachine';
import { notificationService } from '../notification/notificationService';
import { activeUploads } from '../storage/storageService';

export class NgoService {
  async getNgoByUserId(userId: number) {
    const ngos = await query<any[]>(
      `SELECT n.*, ST_Latitude(n.service_center) as centerLat, ST_Longitude(n.service_center) as centerLng
       FROM ngos n WHERE n.user_id = ? AND n.deleted_at IS NULL LIMIT 1`,
      [userId]
    );
    if (ngos.length === 0) {
      throw AppError.forbidden('NGO record not found or has been deleted');
    }
    return ngos[0];
  }

  async getOpenRequestsInArea(ngoId: number, page: number = 0, size: number = 20) {
    const ngo = await query<any[]>('SELECT * FROM ngos WHERE id = ?', [ngoId]);
    if (ngo.length === 0) throw AppError.notFound('NGO not found');

    const radiusKm = Number(ngo[0].service_radius_km);
    const radiusMeters = radiusKm * 1000;
    const offset = page * size;

    // Visibility: status = OPEN, within service radius of service_center,
    // not already rejected by this NGO, cluster parents only (is_cluster_parent = 1 OR cluster_id IS NULL)
    const sql = `
      SELECT r.id, r.category_id as categoryId, c.name as categoryName,
             r.description, r.ai_summary as summary, r.latitude, r.longitude,
             r.address_text as addressText, r.final_priority as finalPriority,
             r.created_at as createdAt, r.escalated_at as escalatedAt,
             r.is_cluster_parent as isClusterParent, r.cluster_id as clusterId,
             rc.size as clusterSize,
             ROUND(ST_Distance_Sphere(r.location, n.service_center) / 1000, 2) as distanceKm
      FROM requests r
      JOIN categories c ON r.category_id = c.id
      JOIN ngos n ON n.id = ?
      LEFT JOIN request_clusters rc ON r.cluster_id = rc.id
      WHERE r.status = 'OPEN'
        AND (r.is_cluster_parent = TRUE OR r.cluster_id IS NULL)
        AND ST_Distance_Sphere(r.location, n.service_center) <= ?
        AND r.id NOT IN (SELECT request_id FROM ngo_rejections WHERE ngo_id = ?)
      ORDER BY r.final_priority DESC, r.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const items = await query<any[]>(sql, [ngoId, radiusMeters, ngoId, size, offset]);

    const countSql = `
      SELECT COUNT(*) as total
      FROM requests r
      JOIN ngos n ON n.id = ?
      WHERE r.status = 'OPEN'
        AND (r.is_cluster_parent = TRUE OR r.cluster_id IS NULL)
        AND ST_Distance_Sphere(r.location, n.service_center) <= ?
        AND r.id NOT IN (SELECT request_id FROM ngo_rejections WHERE ngo_id = ?)
    `;

    const countRows = await query<any[]>(countSql, [ngoId, radiusMeters, ngoId]);

    return {
      items,
      total: Number(countRows[0].total),
    };
  }

  async claimRequest(ngoId: number, requestId: number) {
    return withTransaction(async (conn: PoolConnection) => {
      // 1. Verify NGO status
      const [ngoRows]: any = await conn.query(
        'SELECT * FROM ngos WHERE id = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE',
        [ngoId]
      );
      if (ngoRows.length === 0) throw AppError.forbidden('NGO not found or deleted');
      const ngo = ngoRows[0];
      if (ngo.deactivated_at) throw AppError.forbidden('NGO account is deactivated');
      if (!ngo.verified) throw AppError.forbidden('Only verified NGOs can claim requests');

      // 2. Lock request row FOR UPDATE
      const [reqRows]: any = await conn.query(
        'SELECT * FROM requests WHERE id = ? FOR UPDATE',
        [requestId]
      );
      if (reqRows.length === 0) throw AppError.notFound(`Request #${requestId} not found`);
      const req = reqRows[0];

      if (req.status !== 'OPEN') {
        throw new AppError(409, 'ALREADY_CLAIMED', 'Request is not in OPEN status');
      }

      // Check active claim key
      const [existingActive]: any = await conn.query(
        'SELECT id FROM ngo_claims WHERE request_id = ? AND active_key IS NOT NULL LIMIT 1',
        [requestId]
      );
      if (existingActive.length > 0) {
        throw new AppError(409, 'ALREADY_CLAIMED', 'This request is already claimed by another NGO');
      }

      // 3. Lock/create daily_limits row for (ngo_id, today in Asia/Kolkata) FOR UPDATE
      const todayKolkata = getTodayInKolkata();
      await conn.query(
        `INSERT INTO daily_limits (ngo_id, limit_date, claim_count, created_at, updated_at)
         VALUES (?, ?, 0, NOW(), NOW())
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [ngoId, todayKolkata]
      );

      const [limitRows]: any = await conn.query(
        'SELECT claim_count FROM daily_limits WHERE ngo_id = ? AND limit_date = ? FOR UPDATE',
        [ngoId, todayKolkata]
      );

      const currentClaimsToday = limitRows[0].claim_count;
      if (currentClaimsToday >= config.ngo.maxClaimsPerDay) {
        throw new AppError(
          409,
          'DAILY_CLAIM_LIMIT_REACHED',
          `Daily claim limit reached (${config.ngo.maxClaimsPerDay} claims per day).`
        );
      }

      // 4. Concurrent active claims check
      const [activeClaims]: any = await conn.query(
        `SELECT COUNT(*) as count FROM ngo_claims WHERE ngo_id = ? AND status = 'ACTIVE'`,
        [ngoId]
      );
      if (activeClaims[0].count >= config.ngo.maxConcurrentClaims) {
        throw new AppError(
          409,
          'CONCURRENT_CLAIM_LIMIT_REACHED',
          `Maximum concurrent active claims limit reached (${config.ngo.maxConcurrentClaims}).`
        );
      }

      // 5. Insert claim record with active_key = request_id
      const [claimResult]: any = await conn.query(
        `INSERT INTO ngo_claims (request_id, ngo_id, status, active_key, claimed_at, created_at, updated_at)
         VALUES (?, ?, 'ACTIVE', ?, NOW(), NOW(), NOW())`,
        [requestId, ngoId, requestId]
      );

      // Increment daily limit
      await conn.query(
        `UPDATE daily_limits SET claim_count = claim_count + 1 WHERE ngo_id = ? AND limit_date = ?`,
        [ngoId, todayKolkata]
      );

      // 6. Transition state machine OPEN -> CLAIMED
      await requestStateMachine.transition(
        requestId,
        'CLAIMED',
        { id: ngo.user_id, role: 'NGO' },
        { note: `Claimed by NGO: ${ngo.name}`, extra: { claimId: claimResult.insertId } },
        conn
      );

      return {
        claimId: claimResult.insertId,
        requestId,
        status: 'CLAIMED',
        message: 'Request claimed successfully.',
      };
    });
  }

  async rejectRequest(ngoId: number, requestId: number, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw AppError.badRequest('Rejection reason is required');
    }

    const ngo = await query<any[]>('SELECT * FROM ngos WHERE id = ?', [ngoId]);
    if (ngo.length === 0) throw AppError.notFound('NGO not found');

    // Insert into ngo_rejections
    await execute(
      `INSERT INTO ngo_rejections (request_id, ngo_id, reason, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE reason = VALUES(reason)`,
      [requestId, ngoId, reason.trim()]
    );

    // Increment NGO rejection count
    await execute('UPDATE ngos SET rejection_count = rejection_count + 1 WHERE id = ?', [ngoId]);

    // Check distinct rejecting NGOs count
    const [rejCount]: any = await query(
      'SELECT COUNT(DISTINCT ngo_id) as count FROM ngo_rejections WHERE request_id = ?',
      [requestId]
    );

    if (rejCount.count >= config.request.rejectThreshold) {
      // Threshold reached: move request to REJECTED_BY_NGO
      await requestStateMachine.transition(
        requestId,
        'REJECTED_BY_NGO',
        { id: null, role: 'SYSTEM' },
        { note: `Rejected by ${rejCount.count} distinct NGOs. Routed to admin queue.` }
      );

      await notificationService.notifyAdmins(
        'Request Rejected by Multiple NGOs',
        `Request #${requestId} has been rejected by ${rejCount.count} NGOs and requires admin review.`,
        requestId
      );
    }

    return { success: true, message: 'Request rejected from NGO queue' };
  }

  async abandonClaim(ngoId: number, claimId: number, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw AppError.badRequest('Abandonment reason is required');
    }

    return withTransaction(async (conn: PoolConnection) => {
      const [claimRows]: any = await conn.query(
        'SELECT * FROM ngo_claims WHERE id = ? AND ngo_id = ? FOR UPDATE',
        [claimId, ngoId]
      );
      if (claimRows.length === 0) throw AppError.notFound('Active claim not found');
      const claim = claimRows[0];

      if (claim.status !== 'ACTIVE') {
        throw AppError.badRequest('Only ACTIVE claims can be abandoned');
      }

      // Mark claim ABANDONED and release active_key
      await conn.query(
        `UPDATE ngo_claims SET status = 'ABANDONED', active_key = NULL, release_reason = ?, updated_at = NOW()
         WHERE id = ?`,
        [reason.trim(), claimId]
      );

      // Increment abandonment_count on NGO
      await conn.query(
        'UPDATE ngos SET abandonment_count = abandonment_count + 1 WHERE id = ?',
        [ngoId]
      );

      // Transition request status to REJECTED_BY_NGO
      const [ngoUser]: any = await conn.query('SELECT user_id FROM ngos WHERE id = ?', [ngoId]);
      await requestStateMachine.transition(
        claim.request_id,
        'REJECTED_BY_NGO',
        { id: ngoUser[0].user_id, role: 'NGO' },
        { note: `Claim abandoned by NGO. Reason: ${reason}` },
        conn
      );

      return { success: true, message: 'Claim abandoned. Request returned to admin attention.' };
    });
  }

  async getHelperSuggestions(ngoId: number, claimId: number) {
    const claims = await query<any[]>(
      `SELECT c.id, c.request_id as requestId, r.latitude, r.longitude
       FROM ngo_claims c
       JOIN requests r ON c.request_id = r.id
       WHERE c.id = ? AND c.ngo_id = ? LIMIT 1`,
      [claimId, ngoId]
    );

    if (claims.length === 0) throw AppError.notFound('Claim not found');
    const claim = claims[0];

    const maxActive = config.helper.maxActiveAssignments; // default 3

    // Find up to 5 active helpers of this NGO, ordered by distance, excluding those with >= 3 active assignments
    const helpers = await query<any[]>(
      `SELECT h.id, h.name, h.phone, h.area_label as areaLabel, h.photo_url as photoUrl,
              ROUND(ST_Distance_Sphere(h.home_location, ST_GeomFromText(?, 4326, 'axis-order=lat-long')) / 1000, 2) as distanceKm,
              (SELECT COUNT(*) FROM assignments a WHERE a.helper_id = h.id AND a.status IN ('ASSIGNED', 'IN_PROGRESS')) as activeAssignments
       FROM helpers h
       WHERE h.ngo_id = ? AND h.active = TRUE
         AND (SELECT COUNT(*) FROM assignments a WHERE a.helper_id = h.id AND a.status IN ('ASSIGNED', 'IN_PROGRESS')) < ?
       ORDER BY distanceKm ASC
       LIMIT 5`,
      [`POINT(${claim.latitude} ${claim.longitude})`, ngoId, maxActive]
    );

    return helpers;
  }

  async assignHelper(ngoId: number, claimId: number, helperId: number, note?: string) {
    return withTransaction(async (conn: PoolConnection) => {
      const [claims]: any = await conn.query(
        'SELECT * FROM ngo_claims WHERE id = ? AND ngo_id = ? AND status = "ACTIVE" FOR UPDATE',
        [claimId, ngoId]
      );
      if (claims.length === 0) throw AppError.notFound('Active claim not found');
      const claim = claims[0];

      const [helpers]: any = await conn.query(
        'SELECT * FROM helpers WHERE id = ? AND ngo_id = ? AND active = TRUE LIMIT 1',
        [helperId, ngoId]
      );
      if (helpers.length === 0) throw AppError.notFound('Helper not found or does not belong to this NGO');

      // Cancel any prior active assignment on this claim
      await conn.query(
        `UPDATE assignments SET status = 'CANCELLED', updated_at = NOW() WHERE claim_id = ? AND status = 'ASSIGNED'`,
        [claimId]
      );

      // Create new assignment
      const [assignResult]: any = await conn.query(
        `INSERT INTO assignments (claim_id, helper_id, status, assigned_at, note, created_at, updated_at)
         VALUES (?, ?, 'ASSIGNED', NOW(), ?, NOW(), NOW())`,
        [claimId, helperId, note || null]
      );

      // State machine transition CLAIMED -> ASSIGNED
      const [ngoUser]: any = await conn.query('SELECT user_id FROM ngos WHERE id = ?', [ngoId]);
      await requestStateMachine.transition(
        claim.request_id,
        'ASSIGNED',
        { id: ngoUser[0].user_id, role: 'NGO' },
        { note: `Assigned to helper: ${helpers[0].name}` },
        conn
      );

      return {
        assignmentId: assignResult.insertId,
        helperName: helpers[0].name,
        status: 'ASSIGNED',
      };
    });
  }

  async startWork(ngoId: number, claimId: number) {
    const claims = await query<any[]>(
      'SELECT * FROM ngo_claims WHERE id = ? AND ngo_id = ? AND status = "ACTIVE" LIMIT 1',
      [claimId, ngoId]
    );
    if (claims.length === 0) throw AppError.notFound('Active claim not found');
    const claim = claims[0];

    const ngoUser = await query<any[]>('SELECT user_id FROM ngos WHERE id = ?', [ngoId]);

    // Update assignment to IN_PROGRESS
    await execute(
      `UPDATE assignments SET status = 'IN_PROGRESS', started_at = NOW() WHERE claim_id = ? AND status = 'ASSIGNED'`,
      [claimId]
    );

    // Transition state machine ASSIGNED -> IN_PROGRESS
    await requestStateMachine.transition(
      claim.request_id,
      'IN_PROGRESS',
      { id: ngoUser[0].user_id, role: 'NGO' },
      { note: 'Work started by NGO helper' }
    );

    return { success: true, status: 'IN_PROGRESS' };
  }

  async attachProofPhoto(
    ngoId: number,
    claimId: number,
    kind: 'BEFORE' | 'AFTER',
    uploadId: string
  ) {
    const claims = await query<any[]>(
      'SELECT * FROM ngo_claims WHERE id = ? AND ngo_id = ? AND status = "ACTIVE" LIMIT 1',
      [claimId, ngoId]
    );
    if (claims.length === 0) throw AppError.notFound('Active claim not found');
    const claim = claims[0];

    const assignments = await query<any[]>(
      'SELECT id FROM assignments WHERE claim_id = ? AND status IN ("ASSIGNED", "IN_PROGRESS") ORDER BY created_at DESC LIMIT 1',
      [claimId]
    );
    const assignmentId = assignments.length > 0 ? assignments[0].id : null;

    const meta = activeUploads.get(uploadId);
    if (!meta) throw AppError.badRequest('Uploaded photo not found or expired');

    const ngoUser = await query<any[]>('SELECT user_id FROM ngos WHERE id = ?', [ngoId]);

    const result = await execute(
      `INSERT INTO request_photos (request_id, uploaded_by, kind, assignment_id, url, mime_type, size_bytes, sha256, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        claim.request_id,
        ngoUser[0].user_id,
        kind,
        assignmentId,
        meta.url,
        meta.mimeType,
        meta.sizeBytes,
        meta.sha256,
      ]
    );

    return { photoId: result.insertId, kind, url: meta.url };
  }

  async completeWork(ngoId: number, claimId: number) {
    const claims = await query<any[]>(
      'SELECT * FROM ngo_claims WHERE id = ? AND ngo_id = ? AND status = "ACTIVE" LIMIT 1',
      [claimId, ngoId]
    );
    if (claims.length === 0) throw AppError.notFound('Active claim not found');
    const claim = claims[0];

    const ngoUser = await query<any[]>('SELECT user_id FROM ngos WHERE id = ?', [ngoId]);

    // Update assignment to DONE
    await execute(
      `UPDATE assignments SET status = 'DONE', finished_at = NOW() WHERE claim_id = ? AND status = 'IN_PROGRESS'`,
      [claimId]
    );

    // Transition state machine IN_PROGRESS -> COMPLETED (guards will check BEFORE and AFTER photos)
    await requestStateMachine.transition(
      claim.request_id,
      'COMPLETED',
      { id: ngoUser[0].user_id, role: 'NGO' },
      { note: 'Work completed by NGO. Awaiting admin closure and verification.' }
    );

    return { success: true, status: 'COMPLETED', message: 'Work marked completed with proof photos.' };
  }

  async getHeatMap(ngoId: number, precision: number = 3) {
    const ngo = await query<any[]>('SELECT * FROM ngos WHERE id = ?', [ngoId]);
    if (ngo.length === 0) throw AppError.notFound('NGO not found');

    const radiusMeters = Number(ngo[0].service_radius_km) * 1000;
    const safePrecision = Math.min(4, Math.max(2, precision));

    const rows = await query<any[]>(
      `SELECT ROUND(r.latitude, ?) as lat, ROUND(r.longitude, ?) as lng,
              COUNT(*) as count,
              ROUND(AVG(COALESCE(r.final_priority, 50)), 1) as avgPriority,
              (SELECT c.name FROM categories c WHERE c.id = r.category_id LIMIT 1) as topCategory
       FROM requests r
       JOIN ngos n ON n.id = ?
       WHERE r.status IN ('OPEN', 'CLAIMED', 'ASSIGNED', 'IN_PROGRESS')
         AND ST_Distance_Sphere(r.location, n.service_center) <= ?
       GROUP BY ROUND(r.latitude, ?), ROUND(r.longitude, ?), r.category_id
       ORDER BY count DESC
       LIMIT 2000`,
      [safePrecision, safePrecision, ngoId, radiusMeters, safePrecision, safePrecision]
    );

    return rows.map((r) => ({
      lat: Number(r.lat),
      lng: Number(r.lng),
      count: Number(r.count),
      avgPriority: Number(r.avgPriority),
      topCategory: r.topCategory,
    }));
  }
}

export const ngoService = new NgoService();
