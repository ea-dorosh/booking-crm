/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeAvailability`);
  if (hasTable) {
    const hasBlockStart = await knex.schema.hasColumn(`EmployeeAvailability`, `block_start_time`);
    const hasBlockEnd = await knex.schema.hasColumn(`EmployeeAvailability`, `block_end_time`);

    if (!hasBlockStart) {
      await knex.raw(`ALTER TABLE EmployeeAvailability ADD COLUMN block_start_time_1 TIME DEFAULT NULL AFTER end_time`);
    }

    if (!hasBlockEnd) {
      await knex.raw(`ALTER TABLE EmployeeAvailability ADD COLUMN block_end_time_1 TIME DEFAULT NULL AFTER block_start_time_1`);
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeAvailability`);
  if (hasTable) {
    const hasBlockStart = await knex.schema.hasColumn(`EmployeeAvailability`, `block_start_time_1`);
    if (hasBlockStart) {
      await knex.raw(`ALTER TABLE EmployeeAvailability DROP COLUMN block_start_time_1`);
    }

    const hasBlockEnd = await knex.schema.hasColumn(`EmployeeAvailability`, `block_end_time_1`);
    if (hasBlockEnd) {
      await knex.raw(`ALTER TABLE EmployeeAvailability DROP COLUMN block_end_time_1`);
    }
  }
};


