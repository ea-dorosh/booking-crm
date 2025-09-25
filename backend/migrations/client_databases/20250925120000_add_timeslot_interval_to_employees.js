/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`Employees`);
  if (hasTable) {
    const hasTimeslotInterval = await knex.schema.hasColumn(`Employees`, `timeslot_interval`);
    if (!hasTimeslotInterval) {
      await knex.raw(`ALTER TABLE Employees ADD COLUMN timeslot_interval ENUM('15','30','60') NOT NULL DEFAULT '30' AFTER advance_booking_time`);
      await knex.raw(`UPDATE Employees SET timeslot_interval = '30' WHERE timeslot_interval IS NULL`);
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
    const hasTimeslotInterval = await knex.schema.hasColumn(`Employees`, `timeslot_interval`);
    if (hasTimeslotInterval) {
      await knex.raw(`ALTER TABLE Employees DROP COLUMN timeslot_interval`);
    }
  }
};
