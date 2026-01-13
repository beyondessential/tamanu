import { QueryInterface } from 'sequelize';

/**
 * Migration 2 of 3: Migrate data from device_registration_quota to device_registration_permission.
 *
 * This is split into three migrations to avoid mixing DDL (schema changes) and DML (data changes)
 * in the same transaction. See CLAUDE.md in packages/database for details.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE users
    SET device_registration_permission = CASE
      WHEN device_registration_quota = 0 THEN 'none'
      WHEN device_registration_quota = 1 THEN 'single'
      ELSE 'unlimited'
    END
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE users
    SET device_registration_quota = CASE
      WHEN device_registration_permission = 'none' THEN 0
      WHEN device_registration_permission = 'single' THEN 1
      ELSE 999
    END
  `);
}
