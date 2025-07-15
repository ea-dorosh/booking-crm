/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Fix category_id column type in Services table
  const hasCategoryIdInServices = await knex.schema.hasColumn('Services', 'category_id');
  if (hasCategoryIdInServices) {
    // Drop the foreign key constraint first
    try {
      await knex.schema.alterTable('Services', (table) => {
        table.dropForeign(['category_id']);
      });
    } catch (error) {
      // Foreign key might not exist, continue
      console.log('Foreign key category_id might not exist, continuing...');
    }

    // Change column type from bigint unsigned to int unsigned
    await knex.raw('ALTER TABLE Services MODIFY COLUMN category_id int unsigned DEFAULT NULL');

    // Re-add the foreign key constraint
    await knex.schema.alterTable('Services', (table) => {
      table.foreign('category_id').references('id').inTable('ServiceCategories').onDelete('SET NULL');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  // Revert category_id column type in Services table back to bigint unsigned
  const hasCategoryIdInServices = await knex.schema.hasColumn('Services', 'category_id');
  if (hasCategoryIdInServices) {
    // Drop the foreign key constraint first
    try {
      await knex.schema.alterTable('Services', (table) => {
        table.dropForeign(['category_id']);
      });
    } catch (error) {
      // Foreign key might not exist, continue
      console.log('Foreign key category_id might not exist, continuing...');
    }

    // Change column type back to bigint unsigned
    await knex.raw('ALTER TABLE Services MODIFY COLUMN category_id bigint unsigned DEFAULT NULL');

    // Re-add the foreign key constraint
    await knex.schema.alterTable('Services', (table) => {
      table.foreign('category_id').references('id').inTable('ServiceCategories').onDelete('SET NULL');
    });
  }
};
