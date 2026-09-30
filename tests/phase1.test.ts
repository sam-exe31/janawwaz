import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { runMigrations } from '../src/database/migrate';
import { getDbPool } from '../src/database/db';

describe('Phase 1 Foundation & Auth Test Suite', () => {
  beforeAll(async () => {
    // Ensure migrations are run before testing
    await runMigrations();
  });

  afterAll(async () => {
    const pool = getDbPool();
    await pool.end();
  });

  describe('Health and Public Endpoints', () => {
    it('GET /actuator/health should return UP status', async () => {
      const res = await request(app).get('/actuator/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    it('GET /api/v1/categories should return active categories', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(10);
      expect(res.body.data[0]).toHaveProperty('slug');
      expect(res.body.data[0]).toHaveProperty('basePriority');
    });

    it('POST /api/v1/public/visit should record visits and set cookie', async () => {
      const res = await request(app).post('/api/v1/public/visit');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('count');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('GET /api/v1/leaderboard should return seeded NGOs', async () => {
      const res = await request(app).get('/api/v1/leaderboard');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('rank');
      expect(res.body.data[0]).toHaveProperty('rankScore');
    });

    it('GET /api/v1/ngos/1/profile should return NGO public profile', async () => {
      const res = await request(app).get('/api/v1/ngos/1/profile');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Pune Seva Foundation');
      expect(res.body.data).toHaveProperty('leaderboardPosition');
    });
  });

  describe('Citizen OTP Flow', () => {
    it('POST /api/v1/auth/otp/request with non-whitelisted phone should return 403 PHONE_NOT_ALLOWED', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone: '+919999999999' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PHONE_NOT_ALLOWED');
    });

    it('POST /api/v1/auth/otp/request with invalid phone format should return 400 VALIDATION_FAILED', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone: '9000000001' }); // missing +

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
    });

    it('POST /api/v1/auth/otp/request with whitelisted phone should return 200', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone: '+919000000001' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v1/auth/otp/verify with wrong code should return 400 INVALID_OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: '+919000000001', code: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_OTP');
    });

    let citizenAccessToken = '';
    let citizenRefreshToken = '';

    it('POST /api/v1/auth/otp/verify with correct dummy code should return tokens and create user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: '+919000000001', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.role).toBe('CITIZEN');
      expect(res.body.data.user.phone).toBe('+919000000001');

      citizenAccessToken = res.body.data.accessToken;
      citizenRefreshToken = res.body.data.refreshToken;
    });

    it('GET /api/v1/me with citizen access token should return citizen profile', async () => {
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${citizenAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('+919000000001');
      expect(res.body.data.role).toBe('CITIZEN');
      expect(res.body.data.rewardsBalance).toBeGreaterThanOrEqual(0);
    });

    it('PUT /api/v1/me should update citizen name and bio', async () => {
      const res = await request(app)
        .put('/api/v1/me')
        .set('Authorization', `Bearer ${citizenAccessToken}`)
        .send({ name: 'Sam Citizen', bio: 'Active citizen helping Pune' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sam Citizen');
      expect(res.body.data.bio).toBe('Active citizen helping Pune');
    });

    it('POST /api/v1/auth/refresh should issue a new access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: citizenRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });
  });

  describe('Password Login Flow (Admin & NGO)', () => {
    it('POST /api/v1/auth/login with invalid password should return 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@civic.gov.in', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('POST /api/v1/auth/login with valid Admin credentials should return ADMIN tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@civic.gov.in', password: 'Admin@123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('POST /api/v1/auth/login with valid NGO credentials should return NGO tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'kothrud.ngo@civic.gov.in', password: 'Ngo@123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('NGO');
      expect(res.body.data).toHaveProperty('accessToken');
    });
  });
});
