/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  if (await knex.schema.hasTable('SavedAppointments')) {
    await knex.schema.alterTable('SavedAppointments', table => {
      table
        .string('location')
        .notNullable()
        .defaultTo('');

      table
        .integer('location_id')
        .notNullable()
        .defaultTo(0);
    });
  };
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  if (await knex.schema.hasTable('SavedAppointments')) {
    await knex.schema.alterTable('SavedAppointments', table => {
      table.dropColumn('location');
      table.dropColumn('location_id');
    });
  };
}
