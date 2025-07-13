/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // This migration is no longer needed since the first migration now uses correct types
  // Just ensure the table exists and has the right structure
  const hasCompanyBranchesTable = await knex.schema.hasTable('CompanyBranches');

  if (!hasCompanyBranchesTable) {
    // If table doesn't exist, create it (shouldn't happen, but just in case)
    await knex.schema.createTable('CompanyBranches', (table) => {
      table.increments('id').primary();
      table.integer('company_id').notNullable();
      table.string('name', 255).notNullable();
      table.string('address_street', 255).nullable();
      table.string('address_zip', 20).nullable();
      table.string('address_city', 255).nullable();
      table.string('address_country', 255).nullable();
      table.string('phone', 50).nullable();
      table.string('email', 255).nullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('company_id').references('id').inTable('Company').onDelete('CASCADE');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  // Remove branch_id column from Company table
  const hasBranchIdColumn = await knex.schema.hasColumn('Company', 'branch_id');
  if (hasBranchIdColumn) {
    await knex.schema.alterTable('Company', (table) => {
      table.dropForeign(['branch_id']);
      table.dropColumn('branch_id');
    });
  }

  // Drop CompanyBranches table
  const hasCompanyBranchesTable = await knex.schema.hasTable('CompanyBranches');
  if (hasCompanyBranchesTable) {
    await knex.schema.dropTable('CompanyBranches');
  }
};