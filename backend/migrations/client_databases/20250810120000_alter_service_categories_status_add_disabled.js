/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Extend enum for ServiceCategories.status to include 'disabled'
  // MySQL: need to use raw ALTER TABLE to modify ENUM values
  const hasTable = await knex.schema.hasTable('ServiceCategories');
  if (hasTable) {
    await knex.raw("ALTER TABLE ServiceCategories MODIFY COLUMN status ENUM('active','archived','disabled') NOT NULL DEFAULT 'active'");
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  // Revert enum to original values (active, archived)
  const hasTable = await knex.schema.hasTable('ServiceCategories');
  if (hasTable) {
    await knex.raw("ALTER TABLE ServiceCategories MODIFY COLUMN status ENUM('active','archived') NOT NULL DEFAULT 'active'");
  }
};

