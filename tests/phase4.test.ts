import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { runMigrations } from '../src/database/migrate';
import { getDbPool, execute, query } from '../src/database/db';
import { ngoService } from '../src/ngo/ngoService';
import { activeUploads } from '../src/storage/storageService';
import crypto from 'crypto';

describe('Phase 4 NGO Module Test Suite', () => {
  let ngo1Token = '';
  let ngo1Id = 0;
  let ngo2Token = '';
  let ngo2Id = 0;
  let ngo3Token = '';
  let ngo3Id = 0;
  let citizenId = 0;

  beforeAll(async () => {
    await runMigrations();

    // Logins
    const ngo1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kothrud.ngo@civic.gov.in', password: 'Ngo@123456' });
    ngo1Token = ngo1Res.body.data.accessToken;

    const ngo1Db = await query<any[]>('SELECT id FROM ngos WHERE name = "Pune Seva Foundation"');
    ngo1Id = ngo1Db[0].id;

    const ngo2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hadapsar.ngo@civic.gov.in', password: 'Ngo@123456' });
    ngo2Token = ngo2Res.body.data.accessToken;

    const ngo2Db = await query<any[]>('SELECT id FROM ngos WHERE name = "Jan Kalyan Samiti"');
    ngo2Id = ngo2Db[0].id;

    const ngo3Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pimpri.ngo@civic.gov.in', password: 'Ngo@123456' });
    ngo3Token = ngo3Res.body.data.accessToken;

    const ngo3Db = await query<any[]>('SELECT id FROM ngos WHERE name = "Civic Action Trust"');
    ngo3Id = ngo3Db[0].id;

    const citizen = await query<any[]>('SELECT id FROM users WHERE role = "CITIZEN" LIMIT 1');
    citizenId = citizen[0].id;
  });

  afterAll(async () => {
    const pool = getDbPool();
    await pool.end();
  });

  describe('Visibility and Helper Suggestions', () => {
    let testReqId = 0;

    beforeAll(async () => {
      // Create an OPEN request in Kothrud near NGO 1
      const res = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, final_priority, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'Pothole in Kothrud center', ST_GeomFromText('POINT(18.5075 73.8078)', 4326, 'axis-order=lat-long'), 18.5075, 73.8078, 'OPEN', 85.0, NOW())`,
        [citizenId]
      );
      testReqId = res.insertId;
    });

    it('GET /api/v1/ngo/requests should return open requests in service area', async () => {
      const res = await request(app)
        .get('/api/v1/ngo/requests')
        .set('Authorization', `Bearer ${ngo1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.some((r: any) => r.id === testReqId);
      expect(found).toBe(true);
    });

    it('GET /api/v1/ngo/heatmap should return aggregated spatial cells', async () => {
      const res = await request(app)
        .get('/api/v1/ngo/heatmap')
        .set('Authorization', `Bearer ${ngo1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Concurrency & Claim Limits', () => {
    it('20 concurrent claims on one request should produce exactly one success and 19 409s', async () => {
      // Create a fresh open request
      const res = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'Concurrent claim test target', ST_GeomFromText('POINT(18.5080 73.8080)', 4326, 'axis-order=lat-long'), 18.5080, 73.8080, 'OPEN', NOW())`,
        [citizenId]
      );
      const targetReqId = res.insertId;

      // Reset daily limits and active claims for NGO 1 and NGO 2 to ensure headroom
      await execute('DELETE FROM daily_limits WHERE ngo_id IN (?, ?)', [ngo1Id, ngo2Id]);
      await execute("UPDATE ngo_claims SET status = 'COMPLETED', active_key = NULL WHERE ngo_id IN (?, ?)", [ngo1Id, ngo2Id]);

      // Fire 20 concurrent claims from alternating NGOs
      const promises = [];
      for (let i = 0; i < 20; i++) {
        const token = i % 2 === 0 ? ngo1Token : ngo2Token;
        promises.push(
          request(app)
            .post(`/api/v1/ngo/requests/${targetReqId}/claim`)
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const results = await Promise.all(promises);

      const successes = results.filter((r) => r.status === 200);
      const conflicts = results.filter((r) => r.status === 409);

      expect(successes.length).toBe(1);
      expect(conflicts.length).toBe(19);

      // Verify request is CLAIMED in database
      const [reqRow]: any = await query('SELECT status FROM requests WHERE id = ?', [targetReqId]);
      expect(reqRow.status).toBe('CLAIMED');
    });

    it('should reject the 6th claim of the day with DAILY_CLAIM_LIMIT_REACHED (409)', async () => {
      // Set claim_count to 5 (the maximum limit) for NGO 1 today
      const todayKolkata = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      await execute(
        `INSERT INTO daily_limits (ngo_id, limit_date, claim_count, created_at, updated_at)
         VALUES (?, ?, 5, NOW(), NOW())
         ON DUPLICATE KEY UPDATE claim_count = 5`,
        [ngo1Id, todayKolkata]
      );

      // Create an open request
      const reqRes = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'Over limit test request', ST_GeomFromText('POINT(18.5080 73.8080)', 4326, 'axis-order=lat-long'), 18.5080, 73.8080, 'OPEN', NOW())`,
        [citizenId]
      );
      const targetReqId = reqRes.insertId;

      // Attempt claim
      const res = await request(app)
        .post(`/api/v1/ngo/requests/${targetReqId}/claim`)
        .set('Authorization', `Bearer ${ngo1Token}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DAILY_CLAIM_LIMIT_REACHED');
    });
  });

  describe('Full Claim, Assignment, and Completion Workflow', () => {
    let claimId = 0;
    let requestId = 0;

    beforeAll(async () => {
      // Reset limits and previous claims
      await execute('DELETE FROM daily_limits WHERE ngo_id = ?', [ngo3Id]);
      await execute("UPDATE ngo_claims SET status = 'COMPLETED', active_key = NULL WHERE ngo_id = ?", [ngo3Id]);

      // Create request in Pimpri area near NGO 3
      const reqRes = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'Street work repair in Pimpri', ST_GeomFromText('POINT(18.6280 73.8010)', 4326, 'axis-order=lat-long'), 18.6280, 73.8010, 'OPEN', NOW())`,
        [citizenId]
      );
      requestId = reqRes.insertId;

      // NGO 3 claims request
      const claimRes = await request(app)
        .post(`/api/v1/ngo/requests/${requestId}/claim`)
        .set('Authorization', `Bearer ${ngo3Token}`);
      claimId = claimRes.body.data.claimId;
    });

    it('GET /api/v1/ngo/claims/:id/helper-suggestions should return active helpers ordered by distance', async () => {
      const res = await request(app)
        .get(`/api/v1/ngo/claims/${claimId}/helper-suggestions`)
        .set('Authorization', `Bearer ${ngo3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('distanceKm');
    });

    it('POST /api/v1/ngo/claims/:id/assign should assign helper and transition to ASSIGNED', async () => {
      const helpers = await query<any[]>('SELECT id FROM helpers WHERE ngo_id = ? AND active = TRUE LIMIT 1', [ngo3Id]);
      const helperId = helpers[0].id;

      const res = await request(app)
        .post(`/api/v1/ngo/claims/${claimId}/assign`)
        .set('Authorization', `Bearer ${ngo3Token}`)
        .send({ helperId, note: 'Assigned to lead field worker' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ASSIGNED');
    });

    it('POST /api/v1/ngo/claims/:id/start should transition to IN_PROGRESS', async () => {
      const res = await request(app)
        .post(`/api/v1/ngo/claims/${claimId}/start`)
        .set('Authorization', `Bearer ${ngo3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('POST /api/v1/ngo/claims/:id/complete without proof photos should fail with 422 PROOF_PHOTOS_REQUIRED', async () => {
      const res = await request(app)
        .post(`/api/v1/ngo/claims/${claimId}/complete`)
        .set('Authorization', `Bearer ${ngo3Token}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('PROOF_PHOTOS_REQUIRED');
    });

    it('should attach BEFORE and AFTER proof photos and mark work COMPLETED', async () => {
      // Register mock uploads in activeUploads with valid v4 UUIDs
      const beforeUploadId = crypto.randomUUID();
      const afterUploadId = crypto.randomUUID();

      activeUploads.set(beforeUploadId, {
        uploadId: beforeUploadId,
        url: '/api/v1/uploads/files/before.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        sha256: 'before_sha256',
        exifLat: null,
        exifLng: null,
        exifTakenAt: null,
      });

      activeUploads.set(afterUploadId, {
        uploadId: afterUploadId,
        url: '/api/v1/uploads/files/after.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        sha256: 'after_sha256',
        exifLat: null,
        exifLng: null,
        exifTakenAt: null,
      });

      // Attach BEFORE photo
      const beforeRes = await request(app)
        .post(`/api/v1/ngo/claims/${claimId}/photos`)
        .set('Authorization', `Bearer ${ngo3Token}`)
        .send({ kind: 'BEFORE', uploadId: beforeUploadId });
      expect(beforeRes.status).toBe(201);

      // Attach AFTER photo
      const afterRes = await request(app)
        .post(`/api/v1/ngo/claims/${claimId}/photos`)
        .set('Authorization', `Bearer ${ngo3Token}`)
        .send({ kind: 'AFTER', uploadId: afterUploadId });
      expect(afterRes.status).toBe(201);

      // Now complete
      const completeRes = await request(app)
        .post(`/api/v1/ngo/claims/${claimId}/complete`)
        .set('Authorization', `Bearer ${ngo3Token}`);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe('COMPLETED');
    });
  });

  describe('Reject and Abandon Flow', () => {
    it('POST /api/v1/ngo/requests/:id/reject should record rejection and move to REJECTED_BY_NGO on 3rd rejection', async () => {
      const reqRes = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'Request rejected by all NGOs', ST_GeomFromText('POINT(18.5 73.8)', 4326, 'axis-order=lat-long'), 18.5, 73.8, 'OPEN', NOW())`,
        [citizenId]
      );
      const targetReqId = reqRes.insertId;

      // NGO 1 rejects
      await request(app)
        .post(`/api/v1/ngo/requests/${targetReqId}/reject`)
        .set('Authorization', `Bearer ${ngo1Token}`)
        .send({ reason: 'Out of capacity this week' });

      // NGO 2 rejects
      await request(app)
        .post(`/api/v1/ngo/requests/${targetReqId}/reject`)
        .set('Authorization', `Bearer ${ngo2Token}`)
        .send({ reason: 'Specialized equipment not available' });

      // NGO 3 rejects (reaches threshold of 3)
      const res3 = await request(app)
        .post(`/api/v1/ngo/requests/${targetReqId}/reject`)
        .set('Authorization', `Bearer ${ngo3Token}`)
        .send({ reason: 'Not in our priority domain' });

      expect(res3.status).toBe(200);

      // Verify request transitioned to REJECTED_BY_NGO
      const [reqRow]: any = await query('SELECT status FROM requests WHERE id = ?', [targetReqId]);
      expect(reqRow.status).toBe('REJECTED_BY_NGO');
    });
  });
});
