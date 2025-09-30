/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Increase column lengths in SavedAppointments table for better data accommodation
  const hasTable = await knex.schema.hasTable(`SavedAppointments`);
  if (hasTable) {
    // Increase service_name from VARCHAR(45) to VARCHAR(255) - main issue
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN service_name VARCHAR(255)`);

    // Increase email length from VARCHAR(45) to VARCHAR(100) - emails can be long
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN customer_email VARCHAR(100)`);

    // Increase phone length from VARCHAR(45) to VARCHAR(50) - international numbers with formatting
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN customer_phone VARCHAR(50)`);

    // Increase name fields from VARCHAR(45) to VARCHAR(100) - some names can be long
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN customer_first_name VARCHAR(100)`);
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN customer_last_name VARCHAR(100)`);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  // Revert column lengths back to original sizes
  const hasTable = await knex.schema.hasTable(`SavedAppointments`);
  if (hasTable) {
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN service_name VARCHAR(45)`);
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN customer_email VARCHAR(45)`);
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN customer_phone VARCHAR(45)`);
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN customer_first_name VARCHAR(45)`);
    await knex.raw(`ALTER TABLE SavedAppointments MODIFY COLUMN customer_last_name VARCHAR(45)`);
  }
};
