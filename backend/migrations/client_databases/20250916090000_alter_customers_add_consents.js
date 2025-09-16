/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  const hasTable = await knex.schema.hasTable(`Customers`);
  if (!hasTable) return;

  // Add consent_privacy (required at booking) and consent_marketing (optional)
  const hasPrivacy = await knex.schema.hasColumn(`Customers`, `consent_privacy`);
  if (!hasPrivacy) {
    await knex.raw(`ALTER TABLE Customers ADD COLUMN consent_privacy TINYINT(1) NOT NULL DEFAULT 0`);
  }

  const hasMarketing = await knex.schema.hasColumn(`Customers`, `consent_marketing`);
  if (!hasMarketing) {
    await knex.raw(`ALTER TABLE Customers ADD COLUMN consent_marketing TINYINT(1) NOT NULL DEFAULT 0`);
  }
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  const hasTable = await knex.schema.hasTable(`Customers`);
  if (!hasTable) return;

  const hasPrivacy = await knex.schema.hasColumn(`Customers`, `consent_privacy`);
  if (hasPrivacy) {
    await knex.raw(`ALTER TABLE Customers DROP COLUMN consent_privacy`);
  }

  const hasMarketing = await knex.schema.hasColumn(`Customers`, `consent_marketing`);
  if (hasMarketing) {
    await knex.raw(`ALTER TABLE Customers DROP COLUMN consent_marketing`);
  }
};
