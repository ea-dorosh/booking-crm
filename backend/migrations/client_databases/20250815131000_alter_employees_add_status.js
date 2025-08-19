/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`Employees`);
  if (hasTable) {
    const hasStatus = await knex.schema.hasColumn(`Employees`, `status`);
    if (!hasStatus) {
      await knex.raw(`ALTER TABLE Employees ADD COLUMN status ENUM('active','archived','disabled') NOT NULL DEFAULT 'active'`);
      await knex.raw(`UPDATE Employees SET status = 'active' WHERE status IS NULL OR status = ''`);
    } else {
      // Ensure 'disabled' exists in enum
      await knex.raw(`ALTER TABLE Employees MODIFY COLUMN status ENUM('active','archived','disabled') NOT NULL DEFAULT 'active'`);
      await knex.raw(`UPDATE Employees SET status = 'active' WHERE status IS NULL OR status = ''`);
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable(`Employees`);
  if (hasTable) {
    const hasStatus = await knex.schema.hasColumn(`Employees`, `status`);
    if (hasStatus) {
      await knex.raw(`ALTER TABLE Employees DROP COLUMN status`);
    }
  }
};
