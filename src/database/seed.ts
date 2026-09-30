/**
 * Seed entrypoint.
 *
 * The seed data (admin user, categories, reward rules, demo NGOs + helpers)
 * lives in the Flyway-style migration `V2__seed.sql` and is applied by
 * `runMigrations()`. Running the migrations is idempotent — already-applied
 * versions are skipped via `flyway_schema_history` — so `npm run seed` simply
 * ensures the schema and seed data are present.
 */
import { runMigrations } from './migrate';

runMigrations()
  .then(() => {
    console.log('[Seed] Database schema and seed data are up to date.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Seed] Seeding failed:', err);
    process.exit(1);
  });
