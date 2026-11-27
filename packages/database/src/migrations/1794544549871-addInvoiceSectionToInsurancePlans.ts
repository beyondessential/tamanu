import { DataTypes, QueryInterface } from 'sequelize';

const PLANS = 'invoices_invoice_insurance_plans';
const PAYMENTS = 'invoice_insurance_plan_payments';

// A plan covers one section of a split invoice rather than the whole of it, and a payment records
// the section it settles, because one plan attached to two sections carries a balance for each.
// Null keeps the meaning an attachment has today: the plan covers the whole invoice.
const sectionColumn = {
  type: DataTypes.STRING,
  allowNull: true,
  references: { model: 'reference_data', key: 'id' },
};

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(PLANS, 'invoice_section_id', sectionColumn);
  await query.addColumn(PAYMENTS, 'invoice_section_id', sectionColumn);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: this discards which section each attachment and each payment belonged to. It
  // cannot be rebuilt, because an invoice-wide attachment and a per-section one are
  // indistinguishable once the column is gone.
  await query.removeColumn(PAYMENTS, 'invoice_section_id');
  await query.removeColumn(PLANS, 'invoice_section_id');
}
