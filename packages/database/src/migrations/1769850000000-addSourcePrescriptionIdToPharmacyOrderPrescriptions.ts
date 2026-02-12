import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('pharmacy_order_prescriptions', 'source_prescription_id', {
    type: DataTypes.TEXT,
    allowNull: true,
    references: {
      model: 'prescriptions',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('pharmacy_order_prescriptions', 'source_prescription_id');
}
