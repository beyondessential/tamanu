import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Migration 1 of 3: Add the new device_registration_permission column.
 *
 * This is split into three migrations to avoid mixing DDL (schema changes) and DML (data changes)
 * in the same transaction. See CLAUDE.md in packages/database for details.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('users', 'device_registration_permission', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'none',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('users', 'device_registration_permission');
}
