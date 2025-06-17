import { config as loadEnv } from 'dotenv';
import path from 'path';
import { spawn } from 'child_process';

// Определяем какой .env файл загружать
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

// Загружаем переменные из нужного файла
loadEnv({ path: path.resolve(envFile) });

const clientDatabases = process.env.CLIENT_DATABASES?.split(',').map(db => db.trim()) || [];

if (clientDatabases.length === 0) {
  console.log('No client databases found in CLIENT_DATABASES environment variable');
  process.exit(0);
}

console.log(`Found ${clientDatabases.length} client databases:`, clientDatabases);

async function runMigrationForDatabase(database) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 Running migrations for ${database}...`);

    const env = {
      ...process.env,
      CLIENT_DB_NAME: database
    };

    const knexEnv = process.env.NODE_ENV === 'production' ? 'production_clients' : 'client_databases';
    const child = spawn('npx', ['knex', 'migrate:latest', `--env=${knexEnv}`], {
      stdio: 'inherit',
      env
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Migrations completed for ${database}`);
        resolve();
      } else {
        console.log(`❌ Migrations failed for ${database} with code ${code}`);
        reject(new Error(`Migration failed for ${database}`));
      }
    });
  });
}

async function runAllMigrations() {
  try {
    for (const database of clientDatabases) {
      await runMigrationForDatabase(database);
    }
    console.log('\n🎉 All client database migrations completed successfully!');
  } catch (error) {
    console.error('\n💥 Migration process failed:', error.message);
    process.exit(1);
  }
}

runAllMigrations();