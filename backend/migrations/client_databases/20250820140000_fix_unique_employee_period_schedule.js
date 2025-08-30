/**
 * Cleanup duplicates in EmployeePeriodSchedule and enforce unique constraint
 * Priority to keep: rows with meaningful times/pauses; if multiple, keep latest id
 * Then (re)create UNIQUE(period_id, week_number_in_cycle, day_id) if missing
 * @param { import('knex').Knex } knex
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeePeriodSchedule`);
  if (!hasTable) return;

  // 1) Delete duplicates using window function (MySQL 8)
  try {
    await knex.raw(`
      DELETE eps FROM EmployeePeriodSchedule eps
      JOIN (
        SELECT id FROM (
          SELECT
            id,
            period_id,
            week_number_in_cycle,
            day_id,
            ROW_NUMBER() OVER (
              PARTITION BY period_id, week_number_in_cycle, day_id
              ORDER BY
                /* meaningful first */
                (start_time = '00:00:00' AND end_time = '00:00:00' AND block_start_time_1 IS NULL AND block_end_time_1 IS NULL) ASC,
                id DESC
            ) AS rn
          FROM EmployeePeriodSchedule
        ) t
        WHERE t.rn > 1
      ) d ON d.id = eps.id
    `);
  } catch (e) {
    // Fallback without window functions: keep earliest and delete zero-only extras
    await knex.raw(`
      DELETE eps1 FROM EmployeePeriodSchedule eps1
      JOIN (
        SELECT period_id, week_number_in_cycle, day_id, MIN(id) AS keep_id
        FROM EmployeePeriodSchedule
        GROUP BY period_id, week_number_in_cycle, day_id
      ) g ON g.period_id = eps1.period_id AND g.week_number_in_cycle = eps1.week_number_in_cycle AND g.day_id = eps1.day_id
      WHERE eps1.id <> g.keep_id
        AND eps1.start_time = '00:00:00' AND eps1.end_time = '00:00:00'
        AND eps1.block_start_time_1 IS NULL AND eps1.block_end_time_1 IS NULL
    `);
  }

  // 2) Ensure unique index exists
  const [{ count }] = await knex.raw(`
    SELECT COUNT(1) AS count
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'EmployeePeriodSchedule'
      AND index_name = 'unique_period_week_day'
  `).then(r => r[0]);

  if (Number(count) === 0) {
    await knex.raw(`
      ALTER TABLE EmployeePeriodSchedule
      ADD UNIQUE KEY unique_period_week_day (period_id, week_number_in_cycle, day_id)
    `);
  }
};

export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable(`EmployeePeriodSchedule`);
  if (!hasTable) return;
  // Drop unique to rollback
  await knex.raw(`
    ALTER TABLE EmployeePeriodSchedule
    DROP INDEX unique_period_week_day
  `).catch(() => {});
};


