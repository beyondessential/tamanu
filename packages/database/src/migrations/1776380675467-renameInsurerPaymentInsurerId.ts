import type { QueryInterface } from 'sequelize';

const TABLE = 'invoice_insurer_payments';
const OLD_COLUMN = 'insurer_id';
const NEW_COLUMN = 'invoice_insurance_plan_id';

export async function up(query: QueryInterface): Promise<void> {
  await query.renameColumn(TABLE, OLD_COLUMN, NEW_COLUMN);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.renameColumn(TABLE, NEW_COLUMN, OLD_COLUMN);
}
