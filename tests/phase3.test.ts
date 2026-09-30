import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runMigrations } from '../src/database/migrate';
import { getDbPool, execute, query } from '../src/database/db';
import { screeningService } from '../src/screening/screeningService';

function parseFlags(flagsVal: any): string[] {
  if (Array.isArray(flagsVal)) return flagsVal;
  if (typeof flagsVal === 'string') {
    try {
      return JSON.parse(flagsVal);
    } catch {
      return [flagsVal];
    }
  }
  return [];
}

describe('Phase 3 Gemini & Screening Pipeline Test Suite', () => {
  let citizenId = 0;

  beforeAll(async () => {
    await runMigrations();

    const users = await query<any[]>('SELECT id FROM users WHERE role = "CITIZEN" LIMIT 1');
    if (users.length > 0) {
      citizenId = users[0].id;
    } else {
      const res = await execute(
        `INSERT INTO users (phone, role, status, verification_status) VALUES ('+919000000003', 'CITIZEN', 'ACTIVE', 'UNVERIFIED')`
      );
      citizenId = res.insertId;
    }
  });

  afterAll(async () => {
    const pool = getDbPool();
    await pool.end();
  });

  it('should screen a genuine report to OPEN and calculate priority and budget', async () => {
    const insertRes = await execute(
      `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
       VALUES (?, 1, 'PHOTO', 'WEB', 'Deep pothole on main road causing severe traffic hazard', ST_GeomFromText('POINT(18.5204 73.8567)', 4326, 'axis-order=lat-long'), 18.5204, 73.8567, 'SUBMITTED', NOW())`,
      [citizenId]
    );
    const reqId = insertRes.insertId;

    const result = await screeningService.processRequest(reqId);

    expect(result.status).toBe('OPEN');
    expect(result.finalPriority).toBeGreaterThan(0);

    const rows = await query<any[]>('SELECT * FROM requests WHERE id = ?', [reqId]);
    expect(rows[0].status).toBe('OPEN');
    expect(Number(rows[0].ai_genuine_score)).toBeGreaterThanOrEqual(0.6);
    expect(Number(rows[0].ai_budget_min)).toBeGreaterThan(0);
    expect(Number(rows[0].ai_budget_max)).toBeGreaterThan(Number(rows[0].ai_budget_min));
  });

  it('should route to NEEDS_ADMIN_REVIEW with AI_UNAVAILABLE flag if Gemini fails', async () => {
    const insertRes = await execute(
      `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
       VALUES (?, 1, 'PHOTO', 'WEB', 'Simulate network timeout force_ai_failure in request', ST_GeomFromText('POINT(18.5210 73.8570)', 4326, 'axis-order=lat-long'), 18.5210, 73.8570, 'SUBMITTED', NOW())`,
      [citizenId]
    );
    const reqId = insertRes.insertId;

    const result = await screeningService.processRequest(reqId);

    expect(result.status).toBe('NEEDS_ADMIN_REVIEW');
    expect(result.flags).toContain('AI_UNAVAILABLE');

    const rows = await query<any[]>('SELECT status, screening_flags FROM requests WHERE id = ?', [reqId]);
    expect(rows[0].status).toBe('NEEDS_ADMIN_REVIEW');
    const flags = parseFlags(rows[0].screening_flags);
    expect(flags).toContain('AI_UNAVAILABLE');
  });

  it('should auto-reject obvious junk ONLY when both low score and obvious_junk are true', async () => {
    const insertRes = await execute(
      `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
       VALUES (?, 1, 'PHOTO', 'WEB', 'This is obvious spam and a joke', ST_GeomFromText('POINT(18.5220 73.8580)', 4326, 'axis-order=lat-long'), 18.5220, 73.8580, 'SUBMITTED', NOW())`,
      [citizenId]
    );
    const reqId = insertRes.insertId;

    const result = await screeningService.processRequest(reqId);

    expect(result.status).toBe('REJECTED_FAKE');

    const rows = await query<any[]>('SELECT status FROM requests WHERE id = ?', [reqId]);
    expect(rows[0].status).toBe('REJECTED_FAKE');
  });

  it('should cluster duplicates within 100 meters with same category', async () => {
    // Clean up any existing category 2 requests to ensure isolated test
    await execute('DELETE FROM volunteer_actions WHERE request_id IN (SELECT id FROM requests WHERE category_id = 2)');
    await execute('DELETE FROM ratings WHERE request_id IN (SELECT id FROM requests WHERE category_id = 2)');
    await execute('DELETE FROM reward_ledger WHERE request_id IN (SELECT id FROM requests WHERE category_id = 2)');
    await execute('DELETE FROM request_photos WHERE request_id IN (SELECT id FROM requests WHERE category_id = 2)');
    await execute('DELETE FROM ai_analyses WHERE request_id IN (SELECT id FROM requests WHERE category_id = 2)');
    await execute('DELETE FROM notifications WHERE request_id IN (SELECT id FROM requests WHERE category_id = 2)');
    await execute('DELETE FROM request_status_history WHERE request_id IN (SELECT id FROM requests WHERE category_id = 2)');
    await execute('UPDATE requests SET cluster_id = NULL WHERE category_id = 2');
    await execute('DELETE FROM request_clusters WHERE category_id = 2');
    await execute('DELETE FROM requests WHERE category_id = 2');

    const res1 = await execute(
      `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
       VALUES (?, 2, 'PHOTO', 'WEB', 'Big garbage heap near hospital gate', ST_GeomFromText('POINT(18.530000 73.840000)', 4326, 'axis-order=lat-long'), 18.530000, 73.840000, 'OPEN', DATE_SUB(NOW(), INTERVAL 1 HOUR))`,
      [citizenId]
    );
    const parentReqId = res1.insertId;

    const res2 = await execute(
      `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, created_at)
       VALUES (?, 2, 'PHOTO', 'WEB', 'Overflowing garbage bin nearby', ST_GeomFromText('POINT(18.530200 73.840100)', 4326, 'axis-order=lat-long'), 18.530200, 73.840100, 'SUBMITTED', NOW())`,
      [citizenId]
    );
    const childReqId = res2.insertId;

    await screeningService.processRequest(childReqId);

    const childRows = await query<any[]>('SELECT cluster_id, is_cluster_parent FROM requests WHERE id = ?', [childReqId]);
    const parentRows = await query<any[]>('SELECT cluster_id, is_cluster_parent FROM requests WHERE id = ?', [parentReqId]);

    expect(childRows[0].cluster_id).not.toBeNull();
    expect(childRows[0].cluster_id).toBe(parentRows[0].cluster_id);
    expect(parentRows[0].is_cluster_parent).toBe(1);
    expect(childRows[0].is_cluster_parent).toBe(0);

    const clusterRows = await query<any[]>('SELECT size FROM request_clusters WHERE id = ?', [childRows[0].cluster_id]);
    expect(clusterRows[0].size).toBe(2);
  });

  it('should recover stuck screening requests via checkStuckScreening', async () => {
    const insertRes = await execute(
      `INSERT INTO requests (citizen_id, category_id, input_type, source, description, location, latitude, longitude, status, updated_at, created_at)
       VALUES (?, 1, 'PHOTO', 'WEB', 'Stuck request in screening', ST_GeomFromText('POINT(18.5 73.8)', 4326, 'axis-order=lat-long'), 18.5, 73.8, 'SCREENING', DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE))`,
      [citizenId]
    );
    const stuckReqId = insertRes.insertId;

    const recoveredCount = await screeningService.checkStuckScreening();
    expect(recoveredCount).toBeGreaterThanOrEqual(1);

    const rows = await query<any[]>('SELECT status, screening_flags FROM requests WHERE id = ?', [stuckReqId]);
    expect(rows[0].status).toBe('NEEDS_ADMIN_REVIEW');
    const flags = parseFlags(rows[0].screening_flags);
    expect(flags).toContain('SCREENING_TIMEOUT');
  });
});
