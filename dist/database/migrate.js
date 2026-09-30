"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./db");
function parseSqlStatements(sql) {
    // Strip line comments
    const lines = sql.split(/\r?\n/);
    const cleanedLines = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('--') || trimmed.startsWith('#')) {
            continue;
        }
        cleanedLines.push(line);
    }
    const cleanSql = cleanedLines.join('\n');
    return cleanSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
async function runMigrations() {
    const pool = (0, db_1.getDbPool)();
    console.log('[Migration] Checking migration tracking table...');
    // Create flyway_schema_history tracking table
    await pool.query(`
    CREATE TABLE IF NOT EXISTS flyway_schema_history (
      installed_rank INT NOT NULL,
      version VARCHAR(50) NOT NULL PRIMARY KEY,
      description VARCHAR(200) NOT NULL,
      type VARCHAR(20) NOT NULL,
      script VARCHAR(1000) NOT NULL,
      installed_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      execution_time INT NOT NULL,
      success BOOLEAN NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);
    let migrationsDir = path_1.default.join(__dirname, 'migrations');
    if (!fs_1.default.existsSync(migrationsDir)) {
        const cwdSrc = path_1.default.join(process.cwd(), 'src/database/migrations');
        const relativeSrc = path_1.default.join(__dirname, '../../src/database/migrations');
        if (fs_1.default.existsSync(cwdSrc)) {
            migrationsDir = cwdSrc;
        }
        else if (fs_1.default.existsSync(relativeSrc)) {
            migrationsDir = relativeSrc;
        }
    }
    const files = fs_1.default.existsSync(migrationsDir)
        ? fs_1.default.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
        : [];
    for (let i = 0; i < files.length; i++) {
        const filename = files[i];
        const match = filename.match(/^V(\d+(?:_\d+)*)__(.+)\.sql$/);
        if (!match)
            continue;
        const version = match[1];
        const description = match[2].replace(/_/g, ' ');
        const [rows] = await pool.query('SELECT version FROM flyway_schema_history WHERE version = ? AND success = TRUE', [version]);
        if (rows.length > 0) {
            console.log(`[Migration] Already applied: ${filename}`);
            continue;
        }
        console.log(`[Migration] Applying: ${filename} (${description})...`);
        const filePath = path_1.default.join(migrationsDir, filename);
        const sql = fs_1.default.readFileSync(filePath, 'utf-8');
        const statements = parseSqlStatements(sql);
        const startTime = Date.now();
        const conn = await pool.getConnection();
        try {
            for (const statement of statements) {
                if (!statement.trim())
                    continue;
                await conn.query(statement);
            }
            const executionTime = Date.now() - startTime;
            await conn.query(`INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, execution_time, success)
         VALUES (?, ?, ?, 'SQL', ?, ?, TRUE)`, [i + 1, version, description, filename, executionTime]);
            console.log(`[Migration] Successfully applied: ${filename} in ${executionTime}ms`);
        }
        catch (err) {
            console.error(`[Migration] FAILED applying ${filename}:`, err.message);
            throw err;
        }
        finally {
            conn.release();
        }
    }
    console.log('[Migration] All migrations are up to date.');
}
if (require.main === module) {
    runMigrations()
        .then(() => {
        console.log('[Migration] Complete!');
        process.exit(0);
    })
        .catch((err) => {
        console.error('[Migration] Migration error:', err);
        process.exit(1);
    });
}
