/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Create ServiceCategories table if not exists
  const hasServiceCategoriesTable = await knex.schema.hasTable('ServiceCategories');

  if (!hasServiceCategoriesTable) {
    await knex.schema.createTable('ServiceCategories', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('img', 255).nullable();
      table.enum('status', ['active', 'archived']).notNullable().defaultTo('active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Add category_id column to ServiceSubCategories table if not exists
  const hasCategoryIdInSubCategories = await knex.schema.hasColumn('ServiceSubCategories', 'category_id');
  if (!hasCategoryIdInSubCategories) {
    await knex.schema.alterTable('ServiceSubCategories', (table) => {
      table.integer('category_id').unsigned().nullable();
      table.foreign('category_id').references('id').inTable('ServiceCategories').onDelete('SET NULL');
    });
  }

  // Add category_id column to Services table if not exists
  const hasCategoryIdInServices = await knex.schema.hasColumn('Services', 'category_id');
  if (!hasCategoryIdInServices) {
    await knex.schema.alterTable('Services', (table) => {
      table.integer('category_id').unsigned().nullable();
      table.foreign('category_id').references('id').inTable('ServiceCategories').onDelete('SET NULL');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  // Remove category_id column from Services table
  const hasCategoryIdInServices = await knex.schema.hasColumn('Services', 'category_id');
  if (hasCategoryIdInServices) {
    await knex.schema.alterTable('Services', (table) => {
      table.dropForeign(['category_id']);
      table.dropColumn('category_id');
    });
  }

  // Remove category_id column from ServiceSubCategories table
  const hasCategoryIdInSubCategories = await knex.schema.hasColumn('ServiceSubCategories', 'category_id');
  if (hasCategoryIdInSubCategories) {
    await knex.schema.alterTable('ServiceSubCategories', (table) => {
      table.dropForeign(['category_id']);
      table.dropColumn('category_id');
    });
  }

  // Drop ServiceCategories table
  const hasServiceCategoriesTable = await knex.schema.hasTable('ServiceCategories');
  if (hasServiceCategoriesTable) {
    await knex.schema.dropTable('ServiceCategories');
  }
};
