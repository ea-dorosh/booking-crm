import { config as loadEnv } from 'dotenv';
import path from 'path';
import { spawn } from 'child_process';

const envFile = process.env.NODE_ENV === `production` ? `.env.production` : `.env.development`;
loadEnv({ path: path.resolve(envFile) });

const clientDatabases = process.env.CLIENT_DATABASES?.split(`,`).map(db => db.trim()) || [];

if (clientDatabases.length === 0) {
  console.log(`No client databases found in CLIENT_DATABASES environment variable`);
  process.exit(0);
}

console.log(`Found ${clientDatabases.length} client databases:`, clientDatabases);

const extraArgs = process.argv.slice(2); // forward flags like --all, --step=1

async function rollbackMigrationForDatabase(database) {
  return new Promise((resolve, reject) => {
    console.log(`\n↩️ Rolling back migrations for ${database}...`);

    const env = {
      ...process.env,
      CLIENT_DB_NAME: database,
    };

    const knexEnv = process.env.NODE_ENV === `production` ? `production_clients` : `client_databases`;
    const child = spawn(`npx`, [`knex`, `migrate:rollback`, `--env=${knexEnv}`, ...extraArgs], {
      stdio: `inherit`,
      env,
    });

    child.on(`close`, (code) => {
      if (code === 0) {
        console.log(`✅ Rollback completed for ${database}`);
        resolve();
      } else {
        console.log(`❌ Rollback failed for ${database} with code ${code}`);
        reject(new Error(`Rollback failed for ${database}`));
      }
    });
  });
}

async function rollbackAllMigrations() {
  try {
    for (const database of clientDatabases) {
      await rollbackMigrationForDatabase(database);
    }
    console.log(`\n🎉 Rollback for all client databases completed successfully!`);
  } catch (error) {
    console.error(`\n💥 Rollback process failed:`, error.message);
    process.exit(1);
  }
}

rollbackAllMigrations();



