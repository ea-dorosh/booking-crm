/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Check if CompanyBranches table exists
  const hasCompanyBranchesTable = await knex.schema.hasTable('CompanyBranches');

  if (hasCompanyBranchesTable) {
    // First drop the foreign key constraint from Company table
    const hasBranchIdColumn = await knex.schema.hasColumn('Company', 'branch_id');
    if (hasBranchIdColumn) {
      await knex.schema.alterTable('Company', (table) => {
        table.dropForeign(['branch_id']);
        table.dropColumn('branch_id');
      });
    }

    // Drop the foreign key constraint from CompanyBranches table
    await knex.schema.alterTable('CompanyBranches', (table) => {
      table.dropForeign(['company_id']);
    });

    // Drop the company_id column
    await knex.schema.alterTable('CompanyBranches', (table) => {
      table.dropColumn('company_id');
    });
  }

  // Check if branch_id column exists in Company table and add it back
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