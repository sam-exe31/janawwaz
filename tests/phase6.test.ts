import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { runMigrations } from '../src/database/migrate';
import { getDbPool, execute, query } from '../src/database/db';
import { scheduler } from '../src/scheduler/scheduler';

describe('Phase 6 Workflows Test Suite (Public, Ratings, Volunteer, Scheduler)', () => {
  let citizenToken = '';
  let citizenId = 0;
  let ngoToken = '';
  let ngoId = 0;
  let adminToken = '';
  let adminId = 0;
  let testClosedReqId = 0;

  beforeAll(async () => {
    await runMigrations();

    // 1. Citizen login via OTP
    await request(app)
      .post('/api/v1/auth/otp/request')
      .send({ phone: '+919000000001' });

    const citizenRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: '+919000000001', code: '123456' });
    citizenToken = citizenRes.body.data.accessToken;
    citizenId = citizenRes.body.data.user.id;

    // 2. NGO login
    const ngoRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kothrud.ngo@civic.gov.in', password: 'Ngo@123456' });
    ngoToken = ngoRes.body.data.accessToken;
    const ngoDb = await query<any[]>('SELECT id FROM ngos WHERE name = "Pune Seva Foundation"');
    ngoId = ngoDb[0].id;

    // 3. Admin login
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@civic.gov.in', password: 'Admin@123456' });
    adminToken = adminRes.body.data.accessToken;
    adminId = adminRes.body.data.user.id;

    // Clean up previous verification and rating test artifacts
    await execute('DELETE FROM verification_requests WHERE user_id = ?', [citizenId]);
    await execute('UPDATE users SET verification_status = "UNVERIFIED" WHERE id = ?', [citizenId]);
    await execute('DELETE FROM ratings WHERE citizen_id = ?', [citizenId]);

    // 4. Create a test CLOSED request handled by this NGO for rating tests
    const reqRes = await execute(
      `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, closed_at, created_at)
       VALUES (?, 1, 'PHOTO', 'WEB', 'Resolved water pipe leakage in Kothrud', ST_GeomFromText('POINT(18.508 73.808)', 4326, 'axis-order=lat-long'), 18.508, 73.808, 'CLOSED', NOW(), NOW() - INTERVAL 1 DAY)`,
      [citizenId]
    );
    testClosedReqId = reqRes.insertId;

    // Record completed claim
    await execute(
      `INSERT INTO ngo_claims (request_id, ngo_id, status, claimed_at, completed_at, created_at)
       VALUES (?, ?, 'COMPLETED', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 2 DAY)`,
      [testClosedReqId, ngoId]
    );
  });

  afterAll(async () => {
    const pool = getDbPool();
    await pool.end();
  });

  describe('Public Endpoints (Landing Page)', () => {
    it('GET /api/v1/public/stats should return aggregate platform statistics', async () => {
      const res = await request(app).get('/api/v1/public/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalRequests');
      expect(res.body.data).toHaveProperty('resolvedRequests');
      expect(res.body.data).toHaveProperty('activeNgos');
      expect(res.body.data).toHaveProperty('coverageCity');
    });

    it('GET /api/v1/public/feed should return sanitized public issues feed', async () => {
      const res = await request(app).get('/api/v1/public/feed?limit=5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const item = res.body.data[0];
        expect(item).toHaveProperty('categoryName');
        expect(item).toHaveProperty('reporterMaskedName');
        expect(item.reporterMaskedName).toContain('***');
      }
    });

    it('GET /api/v1/public/categories should return all active categories', async () => {
      const res = await request(app).get('/api/v1/public/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(10);
    });

    it('GET /api/v1/public/leaderboard should return ranked NGOs', async () => {
      const res = await request(app).get('/api/v1/public/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('rank');
      expect(res.body.data[0]).toHaveProperty('rankScore');
    });
  });

  describe('Ratings & Feedback Module', () => {
    it('POST /api/v1/requests/:id/rating should record rating, update NGO avg rating, and grant citizen rewards', async () => {
      const res = await request(app)
        .post(`/api/v1/requests/${testClosedReqId}/rating`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          stars: 5,
          comment: 'Excellent work done quickly by the Kothrud team!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stars).toBe(5);
      expect(res.body.data.ngoId).toBe(ngoId);

      // Verify in DB
      const ratingDb = await query<any[]>(
        'SELECT * FROM ratings WHERE request_id = ? AND citizen_id = ?',
        [testClosedReqId, citizenId]
      );
      expect(ratingDb.length).toBe(1);
      expect(ratingDb[0].stars).toBe(5);

      // Verify NGO avg rating updated
      const ngoDb = await query<any[]>('SELECT avg_rating FROM ngos WHERE id = ?', [ngoId]);
      expect(Number(ngoDb[0].avg_rating)).toBeGreaterThan(0);

      // Verify reward points granted
      const rewardDb = await query<any[]>(
        'SELECT * FROM reward_ledger WHERE user_id = ? AND request_id = ?',
        [citizenId, testClosedReqId]
      );
      expect(rewardDb.length).toBeGreaterThan(0);
    });

    it('should reject duplicate rating for the same request with 409 CONFLICT', async () => {
      const res = await request(app)
        .post(`/api/v1/requests/${testClosedReqId}/rating`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ stars: 4 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should reject rating from non-owner citizen with 403 FORBIDDEN', async () => {
      // Login another citizen
      await request(app).post('/api/v1/auth/otp/request').send({ phone: '+919000000002' });
      const otherRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: '+919000000002', code: '123456' });
      const otherToken = otherRes.body.data.accessToken;

      const res = await request(app)
        .post(`/api/v1/requests/${testClosedReqId}/rating`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ stars: 5 });

      expect(res.status).toBe(403);
    });
  });

  describe('Volunteer Module', () => {
    let volunteerReqId = 0;

    beforeAll(async () => {
      // Create an easy / low-budget OPEN request
      const reqRes = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, ai_easy, approved_budget, created_at)
         VALUES (?, 2, 'PHOTO', 'WEB', 'Minor garbage heap near bus stop', ST_GeomFromText('POINT(18.520 73.850)', 4326, 'axis-order=lat-long'), 18.520, 73.850, 'OPEN', TRUE, 500.00, NOW())`,
        [citizenId]
      );
      volunteerReqId = reqRes.insertId;
    });

    it('GET /api/v1/volunteer/requests should return open easy/low-budget requests with masked phones', async () => {
      const res = await request(app)
        .get('/api/v1/volunteer/requests')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const found = res.body.data.find((r: any) => r.id === volunteerReqId);
      expect(found).toBeDefined();
      expect(found.citizenPhoneMasked).toContain('******');
      expect(found.aiEasy).toBe(true);
    });

    it('POST /api/v1/volunteer/requests/:id/actions should record coordination action', async () => {
      const res = await request(app)
        .post(`/api/v1/volunteer/requests/${volunteerReqId}/actions`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          outcome: 'COORDINATING',
          notes: 'Spoke with local shopkeeper to arrange community cleanup bin',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.outcome).toBe('COORDINATING');

      // Verify in DB
      const actionDb = await query<any[]>(
        'SELECT * FROM volunteer_actions WHERE request_id = ? AND volunteer_id = ?',
        [volunteerReqId, citizenId]
      );
      expect(actionDb.length).toBe(1);
    });

    it('POST /api/v1/volunteer/verification should submit application to become verified volunteer', async () => {
      const res = await request(app)
        .post('/api/v1/volunteer/verification')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          motivation: 'Active Pune environmentalist wanting to coordinate rapid civic repairs',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');

      // Check verification status endpoint
      const statusRes = await request(app)
        .get('/api/v1/volunteer/verification')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.user.verificationStatus).toBe('PENDING');
    });
  });

  describe('Scheduler Jobs', () => {
    it('runSlaEscalation should find and escalate overdue requests', async () => {
      // Create request 100 hours old (exceeds Pothole 72h SLA)
      const oldReq = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'Overdue pothole', ST_GeomFromText('POINT(18.5 73.8)', 4326, 'axis-order=lat-long'), 18.5, 73.8, 'OPEN', NOW() - INTERVAL 100 HOUR)`,
        [citizenId]
      );

      const count = await scheduler.runSlaEscalation();
      expect(count).toBeGreaterThanOrEqual(1);

      // Verify escalated_at is populated
      const checkDb = await query<any[]>('SELECT escalated_at FROM requests WHERE id = ?', [
        oldReq.insertId,
      ]);
      expect(checkDb[0].escalated_at).not.toBeNull();
    });

    it('cleanupExpiredData should run without error', async () => {
      await expect(scheduler.cleanupExpiredData()).resolves.not.toThrow();
    });

    it('runNightlyRankRecalculation should recalculate all NGO ranks', async () => {
      await expect(scheduler.runNightlyRankRecalculation()).resolves.not.toThrow();
    });
  });
});
