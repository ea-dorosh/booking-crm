/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`Employees`);
  if (hasTable) {
    const hasAdvanceBookingTime = await knex.schema.hasColumn(`Employees`, `advance_booking_time`);
    if (!hasAdvanceBookingTime) {
      await knex.raw(`ALTER TABLE Employees ADD COLUMN advance_booking_time VARCHAR(20) NOT NULL DEFAULT '00:30:00'`);
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
    const hasAdvanceBookingTime = await knex.schema.hasColumn(`Employees`, `advance_booking_time`);
    if (hasAdvanceBookingTime) {
      await knex.raw(`ALTER TABLE Employees DROP COLUMN advance_booking_time`);
    }
  }
};
