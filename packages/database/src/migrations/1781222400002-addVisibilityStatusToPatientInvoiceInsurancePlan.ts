import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_invoice_insurance_plans', 'visibility_status', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'current',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_invoice_insurance_plans', 'visibility_status');
}
