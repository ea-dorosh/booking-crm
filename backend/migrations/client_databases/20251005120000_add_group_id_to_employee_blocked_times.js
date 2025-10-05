export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeBlockedTimes`);
  if (hasTable) {
    const hasGroupIdColumn = await knex.schema.hasColumn(`EmployeeBlockedTimes`, `group_id`);
    if (!hasGroupIdColumn) {
      await knex.schema.alterTable(`EmployeeBlockedTimes`, (table) => {
        table.string(`group_id`, 36).nullable().after(`id`);
        table.index(`group_id`, `idx_employee_blocked_times_group_id`);
      });
    }
  }
};

export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeBlockedTimes`);
  if (hasTable) {
    const hasGroupIdColumn = await knex.schema.hasColumn(`EmployeeBlockedTimes`, `group_id`);
    if (hasGroupIdColumn) {
      await knex.schema.alterTable(`EmployeeBlockedTimes`, (table) => {
        table.dropIndex(`group_id`, `idx_employee_blocked_times_group_id`);
        table.dropColumn(`group_id`);
      });
    }
  }
};

