import { PoolConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, execute, withTransaction } from '../database/db';
import { config } from '../config';
import { AppError } from '../common/errors';
import { requestStateMachine, RequestStatus } from '../request/requestStateMachine';
import { notificationService } from '../notification/notificationService';
import { rewardService } from '../reward/rewardService';

export class AdminService {
  async getDashboard() {
    // 1. Total citizens, verified citizens, NGOs
    const [citizenCounts]: any = await query(`
      SELECT 
        COUNT(CASE WHEN role = 'CITIZEN' THEN 1 END) as totalCitizens,
        COUNT(CASE WHEN role = 'CITIZEN' AND verification_status = 'VERIFIED' THEN 1 END) as verifiedCitizens,
        COUNT(CASE WHEN role = 'CITIZEN' AND status = 'SUSPENDED' THEN 1 END) as suspendedCitizens
      FROM users WHERE deleted_at IS NULL
    `);

    const [ngoCounts]: any = await query(`
      SELECT 
        COUNT(*) as totalNgos,
        COUNT(CASE WHEN verified = TRUE THEN 1 END) as verifiedNgos
      FROM ngos WHERE deleted_at IS NULL
    `);

    // 2. Requests by status
    const requestsByStatus = await query<any[]>(`
      SELECT status, COUNT(*) as count FROM requests GROUP BY status
    `);

    // 3. Requests by category
    const requestsByCategory = await query<any[]>(`
      SELECT c.name as categoryName, c.slug, COUNT(r.id) as count
      FROM categories c
      LEFT JOIN requests r ON r.category_id = c.id
      GROUP BY c.id, c.name, c.slug
    `);

    // 4. Anonymous daily visitor counts (last 30 days)
    const visitorHistory = await query<any[]>(`
      SELECT visit_date as visitDate, count
      FROM site_visits
      WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY visit_date ASC
    `);

    // 5. Currently logged-in citizens (active within configured window)
    const activeWindowMinutes = config.session.activeWindowMinutes; // default 15
    const [activeCitizens]: any = await query(`
      SELECT COUNT(DISTINCT s.user_id) as currentlyLoggedIn
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.role = 'CITIZEN'
        AND s.revoked_at IS NULL
        AND s.last_seen_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `, [activeWindowMinutes]);

    return {
      citizens: {
        total: Number(citizenCounts.totalCitizens),
        verified: Number(citizenCounts.verifiedCitizens),
        suspended: Number(citizenCounts.suspendedCitizens),
        currentlyLoggedIn: Number(activeCitizens.currentlyLoggedIn),
      },
      ngos: {
        total: Number(ngoCounts.totalNgos),
        verified: Number(ngoCounts.verifiedNgos),
      },
      requestsByStatus: requestsByStatus.reduce((acc: any, row: any) => {
        acc[row.status] = Number(row.count);
        return acc;
      }, {}),
      requestsByCategory,
      visitorHistory,
    };
  }

  async getProgress() {
    // 4 groups defined in Section 13:
    // 1. Completed: CLOSED
    // 2. Pending: OPEN, NEEDS_ADMIN_REVIEW (flag escalated items)
    // 3. In process: CLAIMED, ASSIGNED, IN_PROGRESS, ADMIN_IN_PROGRESS, COMPLETED
    // 4. Rejected by NGOs: REJECTED_BY_NGO
    const [counts]: any = await query(`
      SELECT
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as completedCount,
        COUNT(CASE WHEN status IN ('OPEN', 'NEEDS_ADMIN_REVIEW') THEN 1 END) as pendingCount,
        COUNT(CASE WHEN status IN ('OPEN', 'NEEDS_ADMIN_REVIEW') AND escalated_at IS NOT NULL THEN 1 END) as escalatedPendingCount,
        COUNT(CASE WHEN status IN ('CLAIMED', 'ASSIGNED', 'IN_PROGRESS', 'ADMIN_IN_PROGRESS', 'COMPLETED') THEN 1 END) as inProcessCount,
        COUNT(CASE WHEN status = 'REJECTED_BY_NGO' THEN 1 END) as rejectedByNgoCount
      FROM requests
    `);

    return {
      completed: { count: Number(counts.completedCount) },
      pending: {
        count: Number(counts.pendingCount),
        escalatedCount: Number(counts.escalatedPendingCount),
      },
      inProcess: { count: Number(counts.inProcessCount) },
      rejectedByNgo: { count: Number(counts.rejectedByNgoCount) },
    };
  }

  async getRequests(
    filters: {
      status?: string;
      category?: string;
      flag?: string;
      escalated?: boolean;
    },
    page: number = 0,
    size: number = 20
  ) {
    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (filters.status) {
      whereClauses.push('r.status = ?');
      params.push(filters.status);
    }
    if (filters.category) {
      whereClauses.push('(c.slug = ? OR c.id = ?)');
      params.push(filters.category, filters.category);
    }
    if (filters.escalated) {
      whereClauses.push('r.escalated_at IS NOT NULL');
    }
    if (filters.flag) {
      whereClauses.push('JSON_CONTAINS(r.screening_flags, ?)');
      params.push(JSON.stringify(filters.flag));
    }

    const whereSql = whereClauses.join(' AND ');
    const offset = page * size;

    const items = await query<any[]>(
      `SELECT r.id, r.citizen_id as citizenId, u.name as citizenName, u.phone as citizenPhone,
              r.category_id as categoryId, c.name as categoryName, c.slug as categorySlug,
              r.status, r.input_type as inputType, r.description, r.ai_summary as summary,
              r.latitude, r.longitude, r.address_text as addressText,
              r.final_priority as finalPriority, r.ai_genuine_score as genuineScore,
              r.ai_budget_min as budgetMin, r.ai_budget_max as budgetMax,
              r.approved_budget as approvedBudget, r.screening_flags as flags,
              r.escalated_at as escalatedAt, r.closed_at as closedAt, r.created_at as createdAt
       FROM requests r
       JOIN categories c ON r.category_id = c.id
       JOIN users u ON r.citizen_id = u.id
       WHERE ${whereSql}
       ORDER BY r.final_priority DESC, r.created_at ASC
       LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const [countRows]: any = await query(
      `SELECT COUNT(*) as total FROM requests r JOIN categories c ON r.category_id = c.id WHERE ${whereSql}`,
      params
    );

    return {
      items,
      total: Number(countRows.total),
    };
  }

  async getAdminRequestDetails(requestId: number) {
    const rows = await query<any[]>(
      `SELECT r.*, c.name as categoryName, c.slug as categorySlug,
              sug_c.name as suggestedCategoryName,
              u.name as citizenName, u.phone as citizenPhone, u.email as citizenEmail,
              u.verification_status as citizenVerificationStatus
       FROM requests r
       JOIN categories c ON r.category_id = c.id
       LEFT JOIN categories sug_c ON r.ai_suggested_category_id = sug_c.id
       JOIN users u ON r.citizen_id = u.id
       WHERE r.id = ? LIMIT 1`,
      [requestId]
    );

    if (rows.length === 0) throw AppError.notFound(`Request #${requestId} not found`);
    const req = rows[0];

    const photos = await query<any[]>(
      'SELECT * FROM request_photos WHERE request_id = ?',
      [requestId]
    );

    const history = await query<any[]>(
      `SELECT h.*, u.name as actorName
       FROM request_status_history h
       LEFT JOIN users u ON h.actor_id = u.id
       WHERE h.request_id = ?
       ORDER BY h.created_at ASC`,
      [requestId]
    );

    const aiAnalyses = await query<any[]>(
      'SELECT * FROM ai_analyses WHERE request_id = ? ORDER BY created_at ASC',
      [requestId]
    );

    const claims = await query<any[]>(
      `SELECT cl.*, n.name as ngoName, n.contact_phone as ngoPhone
       FROM ngo_claims cl
       JOIN ngos n ON cl.ngo_id = n.id
       WHERE cl.request_id = ?
       ORDER BY cl.created_at DESC`,
      [requestId]
    );

    return {
      ...req,
      photos,
      history,
      aiAnalyses,
      claims,
    };
  }

  // Admin Request Actions
  async approveRequest(adminId: number, requestId: number, note: string) {
    if (!note) throw AppError.badRequest('Note is required for approval');
    await requestStateMachine.transition(
      requestId,
      'OPEN',
      { id: adminId, role: 'ADMIN' },
      { note }
    );
    return { success: true, status: 'OPEN' };
  }

  async markFake(adminId: number, requestId: number, note: string) {
    if (!note) throw AppError.badRequest('Note is required when marking report fake');
    await requestStateMachine.transition(
      requestId,
      'REJECTED_FAKE',
      { id: adminId, role: 'ADMIN' },
      { note }
    );
    return { success: true, status: 'REJECTED_FAKE' };
  }

  async setCategory(adminId: number, requestId: number, categoryId: number, note: string) {
    if (!note) throw AppError.badRequest('Note is required');
    const categories = await query<any[]>('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (categories.length === 0) throw AppError.badRequest('Category not found');

    await execute('UPDATE requests SET category_id = ?, ai_suggested_category_id = NULL WHERE id = ?', [
      categoryId,
      requestId,
    ]);

    await execute(
      `INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, after_json, created_at)
       VALUES (?, 'ADMIN', 'SET_CATEGORY', 'REQUEST', ?, ?, NOW())`,
      [adminId, requestId, JSON.stringify({ categoryId, note })]
    );

    return { success: true, categoryId };
  }

  async setBudget(adminId: number, requestId: number, approvedBudget: number, note: string) {
    if (!note) throw AppError.badRequest('Note is required');
    if (approvedBudget < 0) throw AppError.badRequest('Budget must be positive');

    await execute('UPDATE requests SET approved_budget = ? WHERE id = ?', [
      approvedBudget,
      requestId,
    ]);

    await execute(
      `INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, after_json, created_at)
       VALUES (?, 'ADMIN', 'SET_BUDGET', 'REQUEST', ?, ?, NOW())`,
      [adminId, requestId, JSON.stringify({ approvedBudget, note })]
    );

    return { success: true, approvedBudget };
  }

  async closeRequest(adminId: number, requestId: number, note: string) {
    if (!note) throw AppError.badRequest('Note is required for closing request');

    // Trigger state machine transition to CLOSED
    await requestStateMachine.transition(
      requestId,
      'CLOSED',
      { id: adminId, role: 'ADMIN' },
      { note }
    );

    // Apply automatic rewards upon closing
    const [reqRow]: any = await query('SELECT citizen_id FROM requests WHERE id = ?', [requestId]);
    if (reqRow && reqRow.citizen_id) {
      await rewardService.awardPoints(
        reqRow.citizen_id,
        'REQUEST_CLOSED',
        'Reward for verified closed civic request',
        requestId,
        adminId
      );
    }

    return { success: true, status: 'CLOSED' };
  }

  async releaseClaim(adminId: number, requestId: number, note: string) {
    if (!note) throw AppError.badRequest('Note is required for releasing claim');

    return withTransaction(async (conn: PoolConnection) => {
      // Find active claim
      const [claims]: any = await conn.query(
        'SELECT id FROM ngo_claims WHERE request_id = ? AND status = "ACTIVE" FOR UPDATE',
        [requestId]
      );

      if (claims.length > 0) {
        await conn.query(
          `UPDATE ngo_claims SET 
            status = 'RELEASED_BY_ADMIN', 
            active_key = NULL, 
            released_by_admin_at = NOW(), 
            released_by = ?, 
            release_reason = ? 
           WHERE id = ?`,
          [adminId, note, claims[0].id]
        );
      }

      await requestStateMachine.transition(
        requestId,
        'OPEN',
        { id: adminId, role: 'ADMIN' },
        { note: `Claim released back to pool: ${note}` },
        conn
      );

      return { success: true, status: 'OPEN', message: 'Claim released back to open pool' };
    });
  }

  async takeOver(adminId: number, requestId: number, note: string) {
    if (!note) throw AppError.badRequest('Note is required');
    await requestStateMachine.transition(
      requestId,
      'ADMIN_IN_PROGRESS',
      { id: adminId, role: 'ADMIN' },
      { note }
    );
    return { success: true, status: 'ADMIN_IN_PROGRESS' };
  }

  async rejectProof(adminId: number, requestId: number, note: string) {
    if (!note) throw AppError.badRequest('Note explaining rejection is mandatory');
    await requestStateMachine.transition(
      requestId,
      'IN_PROGRESS',
      { id: adminId, role: 'ADMIN' },
      { note }
    );
    return { success: true, status: 'IN_PROGRESS' };
  }

  async overrideStatus(adminId: number, requestId: number, toStatus: RequestStatus, note: string) {
    if (!note) throw AppError.badRequest('Mandatory note required for status override');
    await requestStateMachine.transition(
      requestId,
      toStatus,
      { id: adminId, role: 'ADMIN' },
      { note: `Admin override: ${note}` }
    );
    return { success: true, status: toStatus };
  }

  // NGO Management
  async listNgos() {
    return query<any[]>(
      `SELECT n.id, n.name, n.registration_number as registrationNumber,
              n.contact_phone as contactPhone, n.area_label as areaLabel,
              n.service_radius_km as serviceRadiusKm, n.verified,
              n.rank_score as rankScore, n.total_completed as totalCompleted,
              n.avg_rating as avgRating, n.created_at as createdAt,
              u.email, u.status as userStatus, n.deleted_at as deletedAt
       FROM ngos n
       JOIN users u ON n.user_id = u.id
       ORDER BY n.created_at DESC`
    );
  }

  async createNgo(data: {
    name: string;
    email: string;
    registrationNumber: string;
    contactPhone?: string;
    description?: string;
    latitude: number;
    longitude: number;
    serviceRadiusKm?: number;
    areaLabel?: string;
  }) {
    // Generate temporary password
    const tempPassword = `Ngo@${crypto.randomInt(100000, 999999)}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    return withTransaction(async (conn: PoolConnection) => {
      // 1. Create User
      const [userResult]: any = await conn.query(
        `INSERT INTO users (email, password_hash, role, name, status, verification_status, created_at)
         VALUES (?, ?, 'NGO', ?, 'ACTIVE', 'VERIFIED', NOW())`,
        [data.email, passwordHash, data.name]
      );
      const userId = userResult.insertId;

      // 2. Create NGO
      const [ngoResult]: any = await conn.query(
        `INSERT INTO ngos (
          user_id, name, registration_number, contact_phone, description,
          service_center, service_radius_km, area_label, verified, created_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ST_GeomFromText(?, 4326, 'axis-order=lat-long'),
          ?, ?, TRUE, NOW()
        )`,
        [
          userId,
          data.name,
          data.registrationNumber,
          data.contactPhone || null,
          data.description || null,
          `POINT(${data.latitude} ${data.longitude})`,
          data.serviceRadiusKm || 15.0,
          data.areaLabel || null,
        ]
      );

      return {
        ngoId: ngoResult.insertId,
        userId,
        email: data.email,
        temporaryPassword: tempPassword,
        message: 'NGO created successfully. Temporary password shown once.',
      };
    });
  }

  async softDeleteNgo(adminId: number, ngoId: number) {
    return withTransaction(async (conn: PoolConnection) => {
      const [ngos]: any = await conn.query('SELECT user_id FROM ngos WHERE id = ? FOR UPDATE', [ngoId]);
      if (ngos.length === 0) throw AppError.notFound('NGO not found');
      const userId = ngos[0].user_id;

      // Soft delete NGO
      await conn.query('UPDATE ngos SET deleted_at = NOW() WHERE id = ?', [ngoId]);
      await conn.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [userId]);

      // Release all active claims of this NGO to REJECTED_BY_NGO
      const [activeClaims]: any = await conn.query(
        'SELECT request_id, id FROM ngo_claims WHERE ngo_id = ? AND status = "ACTIVE"',
        [ngoId]
      );

      for (const cl of activeClaims) {
        await conn.query(
          `UPDATE ngo_claims SET status = 'RELEASED_BY_ADMIN', active_key = NULL, release_reason = 'NGO_DEACTIVATED' WHERE id = ?`,
          [cl.id]
        );
        await requestStateMachine.transition(
          cl.request_id,
          'REJECTED_BY_NGO',
          { id: adminId, role: 'ADMIN' },
          { note: 'NGO deactivated. Claims released to admin attention.' },
          conn
        );
      }

      return { success: true, message: 'NGO soft deleted and active claims released.' };
    });
  }

  // Citizen Management
  async listCitizens(filters: { verificationStatus?: string; search?: string }, page = 0, size = 20) {
    const where: string[] = ['role = "CITIZEN"', 'deleted_at IS NULL'];
    const params: any[] = [];

    if (filters.verificationStatus) {
      where.push('verification_status = ?');
      params.push(filters.verificationStatus);
    }
    if (filters.search) {
      where.push('(name LIKE ? OR phone LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const offset = page * size;
    const whereSql = where.join(' AND ');

    const citizens = await query<any[]>(
      `SELECT u.id, u.name, u.phone, u.status, u.verification_status as verificationStatus,
              u.created_at as createdAt,
              (SELECT COUNT(*) FROM requests r WHERE r.citizen_id = u.id) as requestCount,
              (SELECT COALESCE(SUM(points), 0) FROM reward_ledger rl WHERE rl.user_id = u.id) as rewardBalance
       FROM users u
       WHERE ${whereSql}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const [countRows]: any = await query(`SELECT COUNT(*) as total FROM users WHERE ${whereSql}`, params);

    return {
      items: citizens,
      total: Number(countRows.total),
    };
  }

  async verifyCitizen(adminId: number, citizenId: number, note?: string) {
    await execute(
      `UPDATE users SET verification_status = 'VERIFIED', verified_at = NOW(), verified_by = ? WHERE id = ?`,
      [adminId, citizenId]
    );

    await notificationService.notify({
      userId: citizenId,
      type: 'VERIFICATION',
      title: 'Verification Approved',
      body: 'Your identity has been verified! You now have volunteer capabilities to coordinate civic resolutions.',
    });

    return { success: true, verificationStatus: 'VERIFIED' };
  }

  async suspendCitizen(adminId: number, citizenId: number, note?: string) {
    await execute('UPDATE users SET status = "SUSPENDED" WHERE id = ?', [citizenId]);
    await execute(
      `INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, after_json, created_at)
       VALUES (?, 'ADMIN', 'SUSPEND_USER', 'USER', ?, ?, NOW())`,
      [adminId, citizenId, JSON.stringify({ status: 'SUSPENDED', note })]
    );
    return { success: true, status: 'SUSPENDED' };
  }

  async reactivateCitizen(adminId: number, citizenId: number) {
    await execute('UPDATE users SET status = "ACTIVE" WHERE id = ?', [citizenId]);
    return { success: true, status: 'ACTIVE' };
  }

  async getAuditLog(page = 0, size = 20) {
    const offset = page * size;
    const logs = await query<any[]>(
      `SELECT a.*, u.name as actorName, u.email as actorEmail
       FROM audit_log a
       LEFT JOIN users u ON a.actor_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [size, offset]
    );
    const [countRows]: any = await query('SELECT COUNT(*) as total FROM audit_log');
    return { items: logs, total: Number(countRows.total) };
  }
}

export const adminService = new AdminService();
