import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { runMigrations } from '../src/database/migrate';
import { getDbPool, execute, query } from '../src/database/db';

describe('Phase 5 Admin Module Test Suite', () => {
  let adminToken = '';
  let adminId = 0;
  let citizenToken = '';
  let citizenId = 0;

  beforeAll(async () => {
    await runMigrations();

    // 1. Admin login
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@civic.gov.in', password: 'Admin@123456' });
    adminToken = adminRes.body.data.accessToken;
    adminId = adminRes.body.data.user.id;

    // 2. Citizen login
    await request(app).post('/api/v1/auth/otp/request').send({ phone: '+919000000004' });
    const citizenRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: '+919000000004', code: '123456' });
    citizenToken = citizenRes.body.data.accessToken;
    citizenId = citizenRes.body.data.user.id;
  });

  afterAll(async () => {
    const pool = getDbPool();
    await pool.end();
  });

  describe('Admin Dashboard and Progress Sections', () => {
    it('GET /api/v1/admin/dashboard should return system metrics and active citizens', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('citizens');
      expect(res.body.data).toHaveProperty('ngos');
      expect(res.body.data).toHaveProperty('requestsByStatus');
      expect(res.body.data.citizens.total).toBeGreaterThan(0);
    });

    it('GET /api/v1/admin/progress should return the 4 groups', async () => {
      const res = await request(app)
        .get('/api/v1/admin/progress')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('completed');
      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('inProcess');
      expect(res.body.data).toHaveProperty('rejectedByNgo');
    });
  });

  describe('Admin Actions & Audit Logging', () => {
    let testReqId = 0;

    beforeAll(async () => {
      const reqRes = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'Report needing admin decision', ST_GeomFromText('POINT(18.5 73.8)', 4326, 'axis-order=lat-long'), 18.5, 73.8, 'NEEDS_ADMIN_REVIEW', NOW())`,
        [citizenId]
      );
      testReqId = reqRes.insertId;
    });

    it('POST /api/v1/admin/requests/:id/approve should move request to OPEN and log to audit_log', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/requests/${testReqId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Reviewed photos and confirmed genuine' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('OPEN');

      // Verify audit_log entry
      const logs = await query<any[]>(
        'SELECT * FROM audit_log WHERE entity_type = "REQUEST" AND entity_id = ? ORDER BY created_at DESC LIMIT 1',
        [testReqId]
      );
      expect(logs.length).toBe(1);
      expect(logs[0].actor_role).toBe('ADMIN');
      expect(logs[0].action).toContain('OPEN');
    });

    it('POST /api/v1/admin/requests/:id/set-budget should update budget and log audit', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/requests/${testReqId}/set-budget`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approvedBudget: 4500.0, note: 'Approved standard municipal budget quota' });

      expect(res.status).toBe(200);
      expect(res.body.data.approvedBudget).toBe(4500.0);

      const [row]: any = await query('SELECT approved_budget FROM requests WHERE id = ?', [testReqId]);
      expect(Number(row.approved_budget)).toBe(4500.0);
    });

    it('POST /api/v1/admin/requests/:id/close should close request and award citizen points', async () => {
      // Put request in COMPLETED
      await execute('UPDATE requests SET status = "COMPLETED" WHERE id = ?', [testReqId]);

      const res = await request(app)
        .post(`/api/v1/admin/requests/${testReqId}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Final work inspected and verified' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CLOSED');

      // Check reward ledger
      const ledger = await query<any[]>(
        'SELECT * FROM reward_ledger WHERE user_id = ? AND request_id = ?',
        [citizenId, testReqId]
      );
      expect(ledger.length).toBeGreaterThan(0);
      expect(ledger[0].points).toBe(10); // REQUEST_CLOSED default
    });
  });

  describe('NGO Management & Soft Delete Cascading', () => {
    let createdNgoId = 0;
    let tempEmail = '';

    it('POST /api/v1/admin/ngos should create NGO and login account with temporary password', async () => {
      tempEmail = `ngo.test.${Date.now()}@civic.gov.in`;

      const res = await request(app)
        .post('/api/v1/admin/ngos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Western Pune Eco Club',
          email: tempEmail,
          registrationNumber: 'MH/PUNE/2026/0999',
          contactPhone: '+919850000001',
          description: 'Local sanitation and tree protection',
          latitude: 18.5204,
          longitude: 73.8567,
          serviceRadiusKm: 12.0,
          areaLabel: 'Shivaji Nagar',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('temporaryPassword');
      expect(res.body.data).toHaveProperty('ngoId');

      createdNgoId = res.body.data.ngoId;
    });

    it('DELETE /api/v1/admin/ngos/:id should soft delete NGO and release active claims to REJECTED_BY_NGO', async () => {
      // Create a request and an active claim held by this newly created NGO
      const reqRes = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'Claim to be released on deactivation', ST_GeomFromText('POINT(18.5 73.8)', 4326, 'axis-order=lat-long'), 18.5, 73.8, 'CLAIMED', NOW())`,
        [citizenId]
      );
      const claimReqId = reqRes.insertId;

      await execute(
        `INSERT INTO ngo_claims (request_id, ngo_id, status, active_key, claimed_at, created_at, updated_at)
         VALUES (?, ?, 'ACTIVE', ?, NOW(), NOW(), NOW())`,
        [claimReqId, createdNgoId, claimReqId]
      );

      // Now admin deletes the NGO
      const delRes = await request(app)
        .delete(`/api/v1/admin/ngos/${createdNgoId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);

      // Verify NGO is soft deleted
      const [ngoRow]: any = await query('SELECT deleted_at FROM ngos WHERE id = ?', [createdNgoId]);
      expect(ngoRow.deleted_at).not.toBeNull();

      // Verify claim was released to REJECTED_BY_NGO for admin attention
      const [reqRow]: any = await query('SELECT status FROM requests WHERE id = ?', [claimReqId]);
      expect(reqRow.status).toBe('REJECTED_BY_NGO');

      const [claimRow]: any = await query('SELECT status, release_reason FROM ngo_claims WHERE request_id = ?', [claimReqId]);
      expect(claimRow.status).toBe('RELEASED_BY_ADMIN');
      expect(claimRow.release_reason).toBe('NGO_DEACTIVATED');
    });
  });

  describe('Citizen Management & Suspension', () => {
    it('POST /api/v1/admin/citizens/:id/suspend should block write access (403)', async () => {
      // Suspend citizen
      const suspRes = await request(app)
        .post(`/api/v1/admin/citizens/${citizenId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Violation of platform terms' });

      expect(suspRes.status).toBe(200);

      // Citizen attempts to submit request -> 403 FORBIDDEN
      const submitRes = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          categoryId: 1,
          description: 'Attempting to report while suspended',
          latitude: 18.5204,
          longitude: 73.8567,
          photoUploadIds: [],
          inputType: 'PHOTO',
        });

      expect(submitRes.status).toBe(403);
      expect(submitRes.body.error.code).toBe('FORBIDDEN');

      // Reactivate citizen
      const reactRes = await request(app)
        .post(`/api/v1/admin/citizens/${citizenId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reactRes.status).toBe(200);
    });
  });
});
