/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Create EmployeeSchedulePeriods
  const hasEmployeeSchedulePeriods = await knex.schema.hasTable(`EmployeeSchedulePeriods`);
  if (!hasEmployeeSchedulePeriods) {
    await knex.schema.createTable(`EmployeeSchedulePeriods`, (table) => {
      table.increments(`id`).primary();
      table.integer(`employee_id`).notNullable();
      table.string(`period_name`, 255).notNullable();
      table.date(`valid_from`).notNullable();
      table.date(`valid_until`).notNullable();
      table.tinyint(`repeat_cycle`).notNullable(); // 1-4
      table.timestamp(`created_at`).defaultTo(knex.fn.now());
      table.timestamp(`updated_at`).defaultTo(knex.fn.now());
    });

    // Add foreign key and indexes via raw to keep control over names
    await knex.raw(`
      ALTER TABLE EmployeeSchedulePeriods
      ADD CONSTRAINT fk_esp_employee
        FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
        ON DELETE CASCADE,
      ADD INDEX idx_employee_dates (employee_id, valid_from, valid_until)
    `);

    // MySQL 8 CHECK constraints (parsed in older versions, enforced in >= 8.0.16)
    await knex.raw(`
      ALTER TABLE EmployeeSchedulePeriods
      ADD CONSTRAINT chk_repeat_cycle CHECK (repeat_cycle IN (1,2,3,4))
    `).catch(() => {});
  }

  // Create EmployeePeriodSchedule
  const hasEmployeePeriodSchedule = await knex.schema.hasTable(`EmployeePeriodSchedule`);
  if (!hasEmployeePeriodSchedule) {
    await knex.schema.createTable(`EmployeePeriodSchedule`, (table) => {
      table.increments(`id`).primary();
      table.integer(`period_id`).unsigned().notNullable();
      table.tinyint(`week_number_in_cycle`).notNullable(); // 1..4
      table.tinyint(`day_id`).notNullable(); // 0..6 (0=Sun)
      table.time(`start_time`).notNullable(); // stored in UTC
      table.time(`end_time`).notNullable();   // stored in UTC
      table.time(`block_start_time_1`).nullable();
      table.time(`block_end_time_1`).nullable();
    });

    await knex.raw(`
      ALTER TABLE EmployeePeriodSchedule
      ADD CONSTRAINT fk_eps_period
        FOREIGN KEY (period_id) REFERENCES EmployeeSchedulePeriods(id)
        ON DELETE CASCADE,
      ADD UNIQUE KEY unique_period_week_day (period_id, week_number_in_cycle, day_id)
    `);

    await knex.raw(`
      ALTER TABLE EmployeePeriodSchedule
      ADD CONSTRAINT chk_week_num CHECK (week_number_in_cycle BETWEEN 1 AND 4),
      ADD CONSTRAINT chk_day_id CHECK (day_id BETWEEN 0 AND 6)
    `).catch(() => {});
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  const hasEmployeePeriodSchedule = await knex.schema.hasTable(`EmployeePeriodSchedule`);
  if (hasEmployeePeriodSchedule) {
    await knex.schema.dropTable(`EmployeePeriodSchedule`);
  }

  const hasEmployeeSchedulePeriods = await knex.schema.hasTable(`EmployeeSchedulePeriods`);
  if (hasEmployeeSchedulePeriods) {
    await knex.schema.dropTable(`EmployeeSchedulePeriods`);
  }
};


