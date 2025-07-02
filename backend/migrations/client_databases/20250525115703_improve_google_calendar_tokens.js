/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Create EmployeeGoogleCalendar table if not exists
  const hasTable = await knex.schema.hasTable('EmployeeGoogleCalendar');

  if (!hasTable) {
    await knex.schema.createTable('EmployeeGoogleCalendar', (table) => {
      table.integer('employee_id').primary();
      table.text('refresh_token').notNullable();
      table.string('calendar_id', 255).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Add new columns for better token management
  const hasExpiresAt = await knex.schema.hasColumn('EmployeeGoogleCalendar', 'expires_at');
  if (!hasExpiresAt) {
    await knex.schema.alterTable('EmployeeGoogleCalendar', (table) => {
      table.timestamp('expires_at').nullable().comment('When the refresh token expires (if known)');
    });
  }

  const hasIsActive = await knex.schema.hasColumn('EmployeeGoogleCalendar', 'is_active');
  if (!hasIsActive) {
    await knex.schema.alterTable('EmployeeGoogleCalendar', (table) => {
      table.boolean('is_active').defaultTo(true).comment('Whether the token is still active');
    });
  }

  const hasLastUsed = await knex.schema.hasColumn('EmployeeGoogleCalendar', 'last_used_at');
  if (!hasLastUsed) {
    await knex.schema.alterTable('EmployeeGoogleCalendar', (table) => {
      table.timestamp('last_used_at').nullable().comment('When the token was last successfully used');
    });
  }

  const hasErrorCount = await knex.schema.hasColumn('EmployeeGoogleCalendar', 'error_count');
  if (!hasErrorCount) {
    await knex.schema.alterTable('EmployeeGoogleCalendar', (table) => {
      table.integer('error_count').defaultTo(0).comment('Number of consecutive errors');
    });
  }

  const hasLastError = await knex.schema.hasColumn('EmployeeGoogleCalendar', 'last_error');
  if (!hasLastError) {
    await knex.schema.alterTable('EmployeeGoogleCalendar', (table) => {
      table.text('last_error').nullable().comment('Last error message');
    });
  }

  const hasUserEmail = await knex.schema.hasColumn('EmployeeGoogleCalendar', 'google_email');
  if (!hasUserEmail) {
    await knex.schema.alterTable('EmployeeGoogleCalendar', (table) => {
      table.string('google_email', 255).nullable().comment('Google account email');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  await knex.schema.alterTable('EmployeeGoogleCalendar', (table) => {
    table.dropColumn('expires_at');
    table.dropColumn('is_active');
    table.dropColumn('last_used_at');
    table.dropColumn('error_count');
    table.dropColumn('last_error');
    table.dropColumn('google_email');
  });
};