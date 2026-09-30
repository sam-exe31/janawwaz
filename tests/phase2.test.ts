import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { runMigrations } from '../src/database/migrate';
import { getDbPool, execute, query } from '../src/database/db';
import { requestStateMachine } from '../src/request/requestStateMachine';

describe('Phase 2 Request Submission and State Machine Test Suite', () => {
  let citizenToken = '';
  let citizenId = 0;
  let adminToken = '';
  let ngoToken = '';
  let testUploadId = '';

  beforeAll(async () => {
    await runMigrations();

    // 1. Citizen login
    await request(app).post('/api/v1/auth/otp/request').send({ phone: '+919000000002' });
    const citizenRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: '+919000000002', code: '123456' });
    citizenToken = citizenRes.body.data.accessToken;
    citizenId = citizenRes.body.data.user.id;

    // Clean up any requests from previous test runs for this citizen
    await execute('DELETE FROM ai_analyses WHERE request_id IN (SELECT id FROM requests WHERE citizen_id = ?)', [citizenId]);
    await execute('DELETE FROM notifications WHERE request_id IN (SELECT id FROM requests WHERE citizen_id = ?)', [citizenId]);
    await execute('DELETE FROM request_status_history WHERE request_id IN (SELECT id FROM requests WHERE citizen_id = ?)', [citizenId]);
    await execute('DELETE FROM request_photos WHERE uploaded_by = ?', [citizenId]);
    await execute('DELETE FROM requests WHERE citizen_id = ?', [citizenId]);

    // 2. Admin login
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@civic.gov.in', password: 'Admin@123456' });
    adminToken = adminRes.body.data.accessToken;

    // 3. NGO login
    const ngoRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kothrud.ngo@civic.gov.in', password: 'Ngo@123456' });
    ngoToken = ngoRes.body.data.accessToken;
  });

  afterAll(async () => {
    const pool = getDbPool();
    await pool.end();
  });

  describe('File Uploads (POST /api/v1/uploads)', () => {
    it('should upload a valid JPEG photo and extract sha256', async () => {
      const dummyJpeg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
        0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
        0x00, 0xbf, 0x00, 0xff, 0xd9,
      ]);

      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${citizenToken}`)
        .attach('files', dummyJpeg, 'pothole.jpg');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]).toHaveProperty('uploadId');
      expect(res.body.data[0].mimeType).toBe('image/jpeg');
      expect(res.body.data[0]).toHaveProperty('sha256');

      testUploadId = res.body.data[0].uploadId;
    });

    it('should reject non-media file types with 400', async () => {
      const textFile = Buffer.from('Plain text file content');
      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${citizenToken}`)
        .attach('files', textFile, 'test.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Citizen Request Submission (POST /api/v1/requests)', () => {
    let createdRequestId = 0;

    it('should reject coordinates outside bounding box', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          categoryId: 1,
          description: 'Large pothole in the road needing urgent repair',
          latitude: 0.5,
          longitude: 10.0,
          photoUploadIds: [testUploadId],
          inputType: 'PHOTO',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject description with repeated characters', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          categoryId: 1,
          description: 'aaaaaaaaaaaaaaaaaaaaa',
          latitude: 18.5204,
          longitude: 73.8567,
          photoUploadIds: [testUploadId],
          inputType: 'PHOTO',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create a civic request in SUBMITTED status', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          categoryId: 1,
          description: 'Deep dangerous pothole right in front of Shivaji Nagar bus stop',
          latitude: 18.5314,
          longitude: 73.8446,
          addressText: 'Shivaji Nagar, Pune',
          photoUploadIds: [testUploadId],
          inputType: 'PHOTO',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data).toHaveProperty('id');

      createdRequestId = res.body.data.id;
    });

    it('should reject immediate second submission due to 10-minute cooldown (429)', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          categoryId: 1,
          description: 'Second report immediately after the first one',
          latitude: 18.5314,
          longitude: 73.8446,
          photoUploadIds: [testUploadId],
          inputType: 'PHOTO',
        });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should reject 4th request in the same day (daily limit = 3)', async () => {
      // Backdate the first created request by 30 minutes to bypass cooldown
      await execute(
        `UPDATE requests SET created_at = DATE_SUB(NOW(), INTERVAL 30 MINUTE) WHERE citizen_id = ?`,
        [citizenId]
      );

      // Insert 2 more requests backdated to reach daily count of 3
      await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'Simulated past request 2', ST_GeomFromText('POINT(18.5 73.8)', 4326, 'axis-order=lat-long'), 18.5, 73.8, 'SUBMITTED', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
                (?, 1, 'PHOTO', 'WEB', 'Simulated past request 3', ST_GeomFromText('POINT(18.5 73.8)', 4326, 'axis-order=lat-long'), 18.5, 73.8, 'SUBMITTED', DATE_SUB(NOW(), INTERVAL 15 MINUTE))`,
        [citizenId, citizenId]
      );

      // Attempting 4th request should return 429
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          categoryId: 1,
          description: 'Attempting fourth report today',
          latitude: 18.5314,
          longitude: 73.8446,
          photoUploadIds: [testUploadId],
          inputType: 'PHOTO',
        });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('GET /api/v1/requests should list citizen own requests', async () => {
      const res = await request(app)
        .get('/api/v1/requests')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/requests/:id should return details with history and photos', async () => {
      const res = await request(app)
        .get(`/api/v1/requests/${createdRequestId}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdRequestId);
      expect(res.body.data.photos.length).toBe(1);
    });
  });

  describe('RequestStateMachine (Section 6 Transition Table)', () => {
    let testReqId = 0;

    beforeAll(async () => {
      const insertRes = await execute(
        `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
         VALUES (?, 1, 'PHOTO', 'WEB', 'State machine test request', ST_GeomFromText('POINT(18.5 73.8)', 4326, 'axis-order=lat-long'), 18.5, 73.8, 'SUBMITTED', NOW())`,
        [citizenId]
      );
      testReqId = insertRes.insertId;
    });

    it('should reject illegal direct transition SUBMITTED -> CLOSED with 409', async () => {
      await expect(
        requestStateMachine.transition(testReqId, 'CLOSED', { id: null, role: 'SYSTEM' })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'ILLEGAL_TRANSITION',
      });
    });

    it('should reject transition if unauthorized actor tries it', async () => {
      await expect(
        requestStateMachine.transition(testReqId, 'SCREENING', { id: citizenId, role: 'CITIZEN' })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'ILLEGAL_TRANSITION',
      });
    });

    it('should successfully execute SUBMITTED -> SCREENING by SYSTEM and append history', async () => {
      const result = await requestStateMachine.transition(testReqId, 'SCREENING', {
        id: null,
        role: 'SYSTEM',
      });

      expect(result.success).toBe(true);
      expect(result.toStatus).toBe('SCREENING');

      // Verify DB status
      const rows: any = await query('SELECT status FROM requests WHERE id = ?', [testReqId]);
      expect(rows[0].status).toBe('SCREENING');

      // Verify request_status_history
      const history = await query<any[]>(
        'SELECT * FROM request_status_history WHERE request_id = ? AND to_status = "SCREENING"',
        [testReqId]
      );
      expect(history.length).toBe(1);
      expect(history[0].actor_role).toBe('SYSTEM');
    });

    it('should successfully execute SCREENING -> OPEN by SYSTEM', async () => {
      const result = await requestStateMachine.transition(testReqId, 'OPEN', {
        id: null,
        role: 'SYSTEM',
      });

      expect(result.success).toBe(true);
      expect(result.toStatus).toBe('OPEN');
    });

    it('should reject IN_PROGRESS -> COMPLETED without proof photos (422)', async () => {
      // Advance OPEN -> CLAIMED -> ASSIGNED -> IN_PROGRESS
      await requestStateMachine.transition(testReqId, 'CLAIMED', { id: 1, role: 'NGO' });
      await requestStateMachine.transition(testReqId, 'ASSIGNED', { id: 1, role: 'NGO' });
      await requestStateMachine.transition(testReqId, 'IN_PROGRESS', { id: 1, role: 'NGO' });

      // Attempt IN_PROGRESS -> COMPLETED with no BEFORE/AFTER photos
      await expect(
        requestStateMachine.transition(testReqId, 'COMPLETED', { id: 1, role: 'NGO' })
      ).rejects.toMatchObject({
        statusCode: 422,
        code: 'PROOF_PHOTOS_REQUIRED',
      });
    });
  });
});
