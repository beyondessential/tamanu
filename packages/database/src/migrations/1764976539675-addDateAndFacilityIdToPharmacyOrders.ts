import { DataTypes, QueryInterface } from 'sequelize';

// Migration 1 of 3: Add columns only (DDL)
// Data backfill is in a separate migration to avoid "pending trigger events" error

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('pharmacy_orders', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });

  await query.addColumn('pharmacy_orders', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'facilities',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('pharmacy_orders', 'facility_id');
  await query.removeColumn('pharmacy_orders', 'date');
}
