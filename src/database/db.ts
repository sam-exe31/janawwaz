import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { config } from '../config';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      timezone: '+00:00', // UTC for storage
      dateStrings: true,
    });
  }
  return pool;
}

export async function withTransaction<T>(
  callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const p = getDbPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const p = getDbPool();
  const [rows] = await p.query(sql, params);
  return rows as T;
}

export async function execute(sql: string, params: any[] = []): Promise<mysql.ResultSetHeader> {
  const p = getDbPool();
  const [result] = await p.execute(sql, params);
  return result as mysql.ResultSetHeader;
}
