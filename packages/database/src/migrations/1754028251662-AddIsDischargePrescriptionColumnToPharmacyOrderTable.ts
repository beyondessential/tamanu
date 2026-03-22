import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('pharmacy_orders', 'is_discharge_prescription', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('pharmacy_orders', 'is_discharge_prescription');
}
