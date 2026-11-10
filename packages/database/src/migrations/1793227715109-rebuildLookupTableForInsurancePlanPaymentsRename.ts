import { QueryInterface } from 'sequelize';

// sync_lookup keys its rows by table name, so renaming the table stranded every existing row under
// the old name: no model resolves that record type any more, and the renamed delete trigger (which
// keys off TG_TABLE_NAME) can no longer clear it. Without this, payments that predate the rename
// stop reaching facilities until something touches each record.
//
// logs.changes.table_name is deliberately left alone: its rows are historical, the only cost is
// that a record's audit trail spans both names, and the index that could serve the filter was
// dropped in 1785467282357 — so rewriting it would mean a sequential scan of the largest table in
// the deployment.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM sync_lookup
    WHERE record_type = 'invoice_insurer_payments';
  `);

  await query.sequelize.query(`
    SELECT flag_lookup_model_to_rebuild('invoice_insurance_plan_payments');
  `);
}

export async function down(): Promise<void> {
  // No reverse migration
}
