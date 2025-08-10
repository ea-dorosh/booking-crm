/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable('ServiceSubCategories');
  if (hasTable) {
    const hasStatus = await knex.schema.hasColumn('ServiceSubCategories', 'status');
    if (!hasStatus) {
      await knex.raw("ALTER TABLE ServiceSubCategories ADD COLUMN status ENUM('active','archived','disabled') NOT NULL DEFAULT 'active'");
      await knex.raw("UPDATE ServiceSubCategories SET status = 'active' WHERE status IS NULL OR status = ''");
    } else {
      // Ensure 'disabled' exists in enum
      await knex.raw("ALTER TABLE ServiceSubCategories MODIFY COLUMN status ENUM('active','archived','disabled') NOT NULL DEFAULT 'active'");
      await knex.raw("UPDATE ServiceSubCategories SET status = 'active' WHERE status IS NULL OR status = ''");
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable('ServiceSubCategories');
  if (hasTable) {
    const hasStatus = await knex.schema.hasColumn('ServiceSubCategories', 'status');
    if (hasStatus) {
      await knex.raw("ALTER TABLE ServiceSubCategories MODIFY COLUMN status ENUM('active','archived') NOT NULL DEFAULT 'active'");
    }
  }
};

