/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Check if CompanyBranches table exists
  const hasCompanyBranchesTable = await knex.schema.hasTable('CompanyBranches');

  if (hasCompanyBranchesTable) {
    // Drop the existing table to recreate without company_id
    await knex.schema.dropTable('CompanyBranches');
  }

  // Recreate CompanyBranches table without company_id column
  await knex.schema.createTable('CompanyBranches', (table) => {
    table.increments('id').primary();
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
  });

  // Check if branch_id column exists in Company table
  const hasBranchIdColumn = await knex.schema.hasColumn('Company', 'branch_id');
  if (!hasBranchIdColumn) {
    await knex.schema.alterTable('Company', (table) => {
      table.integer('branch_id').nullable();
      table.foreign('branch_id').references('id').inTable('CompanyBranches').onDelete('SET NULL');
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