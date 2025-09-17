#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load production environment
const envFile = process.env.NODE_ENV === `production`
  ? `.env.production`
  : `.env.development`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

async function checkAndRunMigration() {
  console.log(`🔍 Checking link tracking migration status...`);

  // Connect to main database to get client list
  const mainPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DEFAULT_DATABASE,
  });

  try {
    // Get all client databases
    const [clients] = await mainPool.execute(`SELECT database_name FROM Companies WHERE database_name IS NOT NULL`);

    console.log(`📋 Found ${clients.length} client databases`);

    for (const client of clients) {
      const databaseName = client.database_name;
      console.log(`\n🏢 Checking database: ${databaseName}`);

      const clientPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: databaseName,
      });

      try {
        // Check if TrackingLinkClicks table exists
        const [tables] = await clientPool.execute(
          `SHOW TABLES LIKE 'TrackingLinkClicks'`,
        );

        if (tables.length === 0) {
          console.log(`❌ TrackingLinkClicks table missing in ${databaseName}`);
          console.log(`🛠️  Creating table...`);

          // Create the table
          await clientPool.execute(`
            CREATE TABLE TrackingLinkClicks (
              id INT AUTO_INCREMENT PRIMARY KEY,
              clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              user_agent TEXT,
              ip_address VARCHAR(45),
              referrer VARCHAR(500),
              channel VARCHAR(100) NOT NULL,
              target VARCHAR(255) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `);

          console.log(`✅ TrackingLinkClicks table created in ${databaseName}`);
        } else {
          console.log(`✅ TrackingLinkClicks table exists in ${databaseName}`);

          // Check if there are any records
          const [count] = await clientPool.execute(
            `SELECT COUNT(*) as count FROM TrackingLinkClicks`,
          );
          console.log(`📊 Records in table: ${count[0].count}`);
        }
      } catch (error) {
        console.error(`❌ Error checking ${databaseName}:`, error.message);
      } finally {
        await clientPool.end();
      }
    }

    console.log(`\n🎉 Migration check completed!`);

  } catch (error) {
    console.error(`❌ Error:`, error);
  } finally {
    await mainPool.end();
  }
}

checkAndRunMigration();
