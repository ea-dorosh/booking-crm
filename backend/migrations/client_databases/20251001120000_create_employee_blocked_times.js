/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeBlockedTimes`);
  if (!hasTable) {
    await knex.raw(`
      CREATE TABLE EmployeeBlockedTimes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        blocked_date DATE NOT NULL,
        start_time TIME NULL,
        end_time TIME NULL,
        is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE CASCADE,
        INDEX idx_employee_date (employee_id, blocked_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeeBlockedTimes`);
  if (hasTable) {
    await knex.raw(`DROP TABLE EmployeeBlockedTimes`);
  }
};

