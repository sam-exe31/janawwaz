import app from './app';
import { config } from './config';
import { runMigrations } from './database/migrate';
import { scheduler } from './scheduler/scheduler';

async function bootstrap() {
  try {
    console.log(`[Server] Starting Civic Issue Platform in ${config.server.env} mode...`);

    // Ensure database migrations are up to date
    try {
      await runMigrations();
      console.log('[Server] Database migrations verified.');
    } catch (dbErr: any) {
      console.warn('[Server] Notice: Database connection skipped or pending (' + (dbErr?.message || dbErr) + '). Server running in resilient mode.');
    }

    // Start background jobs (SLA escalations, screening checks, data cleanups)
    scheduler.startAll();

    const server = app.listen(config.server.port, () => {
      console.log(`[Server] Application listening on http://localhost:${config.server.port}`);
      console.log(`[Server] Web Platform: http://localhost:${config.server.port}/`);
      console.log(`[Server] Swagger UI: http://localhost:${config.server.port}/swagger-ui.html`);
      console.log(`[Server] Health check: http://localhost:${config.server.port}/actuator/health`);
    });

    const shutdown = () => {
      console.log('[Server] Gracefully shutting down...');
      scheduler.stopAll();
      server.close(() => {
        console.log('[Server] Closed remaining connections.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

bootstrap();
