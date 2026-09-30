"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const migrate_1 = require("./database/migrate");
const scheduler_1 = require("./scheduler/scheduler");
async function bootstrap() {
    try {
        console.log(`[Server] Starting Civic Issue Platform in ${config_1.config.server.env} mode...`);
        // Ensure database migrations are up to date
        try {
            await (0, migrate_1.runMigrations)();
            console.log('[Server] Database migrations verified.');
        }
        catch (dbErr) {
            console.warn('[Server] Notice: Database connection skipped or pending (' + (dbErr?.message || dbErr) + '). Server running in resilient mode.');
        }
        // Start background jobs (SLA escalations, screening checks, data cleanups)
        scheduler_1.scheduler.startAll();
        const server = app_1.default.listen(config_1.config.server.port, () => {
            console.log(`[Server] Application listening on http://localhost:${config_1.config.server.port}`);
            console.log(`[Server] Web Platform: http://localhost:${config_1.config.server.port}/`);
            console.log(`[Server] Swagger UI: http://localhost:${config_1.config.server.port}/swagger-ui.html`);
            console.log(`[Server] Health check: http://localhost:${config_1.config.server.port}/actuator/health`);
        });
        const shutdown = () => {
            console.log('[Server] Gracefully shutting down...');
            scheduler_1.scheduler.stopAll();
            server.close(() => {
                console.log('[Server] Closed remaining connections.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (err) {
        console.error('[Server] Fatal startup error:', err);
        process.exit(1);
    }
}
bootstrap();
