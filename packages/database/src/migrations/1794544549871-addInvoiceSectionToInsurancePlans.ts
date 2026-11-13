import { DataTypes, QueryInterface } from 'sequelize';

const PLANS = 'invoices_invoice_insurance_plans';
const PAYMENTS = 'invoice_insurance_plan_payments';

const PER_SECTION_INDEX = 'invoices_invoice_insurance_plans_section_unique';
const INVOICE_WIDE_INDEX = 'invoices_invoice_insurance_plans_whole_invoice_unique';

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

  // Uniqueness was only ever declared on the model, which does not reach the schema here, so an
  // invoice could already hold the same plan twice. These add it for the first time.
  //
  // Two partial indexes rather than one across all three columns, because Postgres treats nulls as
  // distinct in a unique index: without the second, an invoice-wide attachment could still be made
  // over and over. NULLS NOT DISTINCT would say it in one index but is PG15 and up, while this
  // codebase still guards for 13.
  await query.sequelize.query(`
    CREATE UNIQUE INDEX ${PER_SECTION_INDEX}
      ON ${PLANS} (invoice_id, invoice_insurance_plan_id, invoice_section_id)
      WHERE invoice_section_id IS NOT NULL AND deleted_at IS NULL
  `);
  await query.sequelize.query(`
    CREATE UNIQUE INDEX ${INVOICE_WIDE_INDEX}
      ON ${PLANS} (invoice_id, invoice_insurance_plan_id)
      WHERE invoice_section_id IS NULL AND deleted_at IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP INDEX IF EXISTS ${INVOICE_WIDE_INDEX}`);
  await query.sequelize.query(`DROP INDEX IF EXISTS ${PER_SECTION_INDEX}`);
  // DESTRUCTIVE: this discards which section each attachment and each payment belonged to. It
  // cannot be rebuilt, because an invoice-wide attachment and a per-section one are
  // indistinguishable once the column is gone.
  await query.removeColumn(PAYMENTS, 'invoice_section_id');
  await query.removeColumn(PLANS, 'invoice_section_id');
}
