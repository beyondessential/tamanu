import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Migration 3 of 3: Drop the old device_registration_quota column.
 *
 * This is split into three migrations to avoid mixing DDL (schema changes) and DML (data changes)
 * in the same transaction. See CLAUDE.md in packages/database for details.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn('users', 'device_registration_quota');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.addColumn('users', 'device_registration_quota', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}
