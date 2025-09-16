/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`TrackingLinkClicks`);
  if (!hasTable) {
    await knex.schema.createTable(`TrackingLinkClicks`, (table) => {
      table.increments(`id`).primary();
      table.timestamp(`clicked_at`).notNullable().defaultTo(knex.fn.now());
      table.text(`user_agent`).nullable();
      table.string(`ip_address`, 45).nullable();
      table.string(`referrer`, 500).nullable();
      table.string(`channel`, 100).notNullable();
      table.string(`target`, 255).notNullable();
      table.timestamp(`created_at`).defaultTo(knex.fn.now());
      table.timestamp(`updated_at`).defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable(`TrackingLinkClicks`);
  if (hasTable) {
    await knex.schema.dropTable(`TrackingLinkClicks`);
  }
};


