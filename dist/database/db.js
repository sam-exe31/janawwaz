"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbPool = getDbPool;
exports.withTransaction = withTransaction;
exports.query = query;
exports.execute = execute;
const promise_1 = __importDefault(require("mysql2/promise"));
const config_1 = require("../config");
let pool = null;
function getDbPool() {
    if (!pool) {
        pool = promise_1.default.createPool({
            host: config_1.config.db.host,
            port: config_1.config.db.port,
            user: config_1.config.db.user,
            password: config_1.config.db.password,
            database: config_1.config.db.database,
            waitForConnections: true,
            connectionLimit: 20,
            queueLimit: 0,
            timezone: '+00:00', // UTC for storage
            dateStrings: true,
        });
    }
    return pool;
}
async function withTransaction(callback) {
    const p = getDbPool();
    const conn = await p.getConnection();
    try {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
    }
    catch (error) {
        await conn.rollback();
        throw error;
    }
    finally {
        conn.release();
    }
}
async function query(sql, params = []) {
    const p = getDbPool();
    const [rows] = await p.query(sql, params);
    return rows;
}
async function execute(sql, params = []) {
    const p = getDbPool();
    const [result] = await p.execute(sql, params);
    return result;
}
