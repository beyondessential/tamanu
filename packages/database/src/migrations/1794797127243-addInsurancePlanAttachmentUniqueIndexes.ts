import { QueryInterface } from 'sequelize';

const PLANS = 'invoices_invoice_insurance_plans';

const PER_SECTION_INDEX = 'invoices_invoice_insurance_plans_section_unique';
const INVOICE_WIDE_INDEX = 'invoices_invoice_insurance_plans_whole_invoice_unique';

// Uniqueness was only ever declared on the model, which does not reach the schema here, so an
// invoice could hold the same plan twice. These add it for the first time, over a table the
// previous migration has already deduplicated.
//
// Two partial indexes rather than one across all three columns, because Postgres treats nulls as
// distinct in a unique index: without the second, an invoice-wide attachment could still be made
// over and over. NULLS NOT DISTINCT would say it in one index but is PG15 and up, while this
// codebase still guards for 13.
export async function up(query: QueryInterface): Promise<void> {
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
}
