import { DataTypes, QueryInterface } from 'sequelize';

// Migration 3 of 3: Make columns non-nullable (DDL)
// Separated from data backfill to avoid "pending trigger events" error

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn('pharmacy_orders', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });

  await query.changeColumn('pharmacy_orders', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.changeColumn('pharmacy_orders', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.changeColumn('pharmacy_orders', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}
