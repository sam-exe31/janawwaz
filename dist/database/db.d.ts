import mysql, { Pool, PoolConnection } from 'mysql2/promise';
export declare function getDbPool(): Pool;
export declare function withTransaction<T>(callback: (conn: PoolConnection) => Promise<T>): Promise<T>;
export declare function query<T = any>(sql: string, params?: any[]): Promise<T>;
export declare function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader>;
