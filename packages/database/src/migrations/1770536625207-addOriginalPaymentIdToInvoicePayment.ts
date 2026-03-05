import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_payments', 'original_payment_id', {
    type: DataTypes.UUID,
    allowNull: true,
    unique: true,
    references: {
      model: 'invoice_payments',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('invoice_payments', 'original_payment_id');
}
