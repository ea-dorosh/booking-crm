/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Create TrackingQrScans table if not exists
  const hasTrackingQrScansTable = await knex.schema.hasTable('TrackingQrScans');

  if (!hasTrackingQrScansTable) {
    await knex.schema.createTable('TrackingQrScans', (table) => {
      table.increments('id').primary();
      table.timestamp('scanned_at').notNullable().defaultTo(knex.fn.now());
      table.text('user_agent').nullable();
      table.string('ip_address', 45).nullable(); // IPv6 support
      table.string('referrer', 500).nullable();
      table.json('device_info').nullable(); // Additional metadata
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  // Drop TrackingQrScans table
  const hasTrackingQrScansTable = await knex.schema.hasTable('TrackingQrScans');
  if (hasTrackingQrScansTable) {
    await knex.schema.dropTable('TrackingQrScans');
  }
};
