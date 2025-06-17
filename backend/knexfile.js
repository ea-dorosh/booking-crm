import { config as loadEnv } from 'dotenv';
import path from 'path';

// Определяем какой .env файл загружать
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

// Загружаем переменные из нужного файла
loadEnv({ path: path.resolve(envFile) });

const common = {
  client: 'mysql2',
};

export default {
  // Конфигурация для users_database (основная БД)
  development: {
    ...common,
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE, // users_database
    },
    migrations: {
      directory: './migrations/users_database',
      tableName: 'knex_migrations',
    },
  },

  // Конфигурация для клиентских баз данных
  client_databases: {
    ...common,
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.CLIENT_DB_NAME, // Будет переопределяться для каждой клиентской БД
    },
    migrations: {
      directory: './migrations/client_databases',
      tableName: 'knex_migrations',
    },
  },

  production: {
    ...common,
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE, // users_database
    },
    migrations: {
      directory: './migrations/users_database',
      tableName: 'knex_migrations',
    },
  },

  production_clients: {
    ...common,
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.CLIENT_DB_NAME,
    },
    migrations: {
      directory: './migrations/client_databases',
      tableName: 'knex_migrations',
    },
  },
};