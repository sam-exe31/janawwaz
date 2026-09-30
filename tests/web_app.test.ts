import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Web Platform and Endpoints Verification', () => {
  it('GET / should serve index.html', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Janawwaz');
    expect(res.text).toContain('Citizen Phone OTP Access');
  });

  it('GET /styles.css should serve stylesheet', async () => {
    const res = await request(app).get('/styles.css');
    expect(res.status).toBe(200);
    expect(res.text).toContain('--bg-main');
  });

  it('GET /app.js should serve client JavaScript', async () => {
    const res = await request(app).get('/app.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain('API_BASE');
  });

  it('GET /api/v1/public/stats should return stats', async () => {
    const res = await request(app).get('/api/v1/public/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalRequests');
  });

  it('GET /api/v1/public/feed should return feed items', async () => {
    const res = await request(app).get('/api/v1/public/feed');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
