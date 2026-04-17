import type { QueryInterface } from 'sequelize';

const OLD_TABLE = 'invoice_insurer_payments';
const NEW_TABLE = 'invoice_insurance_plan_payments';

export async function up(query: QueryInterface): Promise<void> {
  await query.renameTable(OLD_TABLE, NEW_TABLE);
  await query.renameColumn('invoices', 'insurer_payment_status', 'insurance_plan_payment_status');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.renameTable(NEW_TABLE, OLD_TABLE);
  await query.renameColumn('invoices', 'insurance_plan_payment_status', 'insurer_payment_status');
}
