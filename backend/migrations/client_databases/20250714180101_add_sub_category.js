/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // rename existing table ServiceCategories to ServiceSubCategories
  if (await knex.schema.hasTable('ServiceCategories')) {
    await knex.schema.renameTable('ServiceCategories', 'ServiceSubCategories');
  }

  // rename column category_id to sub_category_id in Services table
  if (await knex.schema.hasTable('Services')) {
    await knex.schema.alterTable('Services', table => {
      table.renameColumn('category_id', 'sub_category_id');
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // rename column sub_category_id back to category_id in Services table
  if (await knex.schema.hasTable('Services')) {
    await knex.schema.alterTable('Services', table => {
      table.renameColumn('sub_category_id', 'category_id');
    });
  }

  // rename table ServiceSubCategories back to ServiceCategories
  if (await knex.schema.hasTable('ServiceSubCategories')) {
    await knex.schema.renameTable('ServiceSubCategories', 'ServiceCategories');
  }
}
