import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_insurance_plans', 'available_facilities', {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('invoice_insurance_plans', 'available_facilities');
}
