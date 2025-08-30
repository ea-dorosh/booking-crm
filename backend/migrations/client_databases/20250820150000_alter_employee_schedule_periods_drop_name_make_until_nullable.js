/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeSchedulePeriods`);
  if (!hasTable) return;

  // Drop period_name if exists
  const hasName = await knex.schema.hasColumn(`EmployeeSchedulePeriods`, `period_name`);
  if (hasName) {
    await knex.raw(`ALTER TABLE EmployeeSchedulePeriods DROP COLUMN period_name`);
  }

  // Make valid_until nullable
  await knex.raw(`ALTER TABLE EmployeeSchedulePeriods MODIFY COLUMN valid_until DATE NULL`);
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeSchedulePeriods`);
  if (!hasTable) return;

  // Re-add period_name (best-effort) and make valid_until NOT NULL with a far future default
  const hasName = await knex.schema.hasColumn(`EmployeeSchedulePeriods`, `period_name`);
  if (!hasName) {
    await knex.raw(`ALTER TABLE EmployeeSchedulePeriods ADD COLUMN period_name VARCHAR(255) NOT NULL DEFAULT 'Schedule' AFTER employee_id`);
  }
  await knex.raw(`UPDATE EmployeeSchedulePeriods SET valid_until = COALESCE(valid_until, '9999-12-31')`);
  await knex.raw(`ALTER TABLE EmployeeSchedulePeriods MODIFY COLUMN valid_until DATE NOT NULL`);
};


