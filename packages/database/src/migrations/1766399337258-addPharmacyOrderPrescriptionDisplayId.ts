import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('pharmacy_order_prescriptions', 'display_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('pharmacy_order_prescriptions', 'display_id');
}
