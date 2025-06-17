/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  if (await knex.schema.hasTable('ServiceCategories')) {
    await knex.schema.alterTable('ServiceCategories', table => {
      table
        .enu('status', ['active', 'archived'])
        .notNullable()
        .defaultTo('active');
    });
  };
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  if (await knex.schema.hasTable('ServiceCategories')) {
    await knex.schema.alterTable('ServiceCategories', table => {
      table.dropColumn('status');
    });
  };
}
