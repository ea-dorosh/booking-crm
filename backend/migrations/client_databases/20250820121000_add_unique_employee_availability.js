/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeAvailability`);
  if (hasTable) {
    // Try to add unique index on (employee_id, day_id)
    await knex.raw(`
      ALTER TABLE EmployeeAvailability
      ADD UNIQUE KEY uniq_employee_day (employee_id, day_id)
    `).catch(() => {});
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeAvailability`);
  if (hasTable) {
    await knex.raw(`
      ALTER TABLE EmployeeAvailability
      DROP INDEX uniq_employee_day
    `).catch(() => {});
  }
};


