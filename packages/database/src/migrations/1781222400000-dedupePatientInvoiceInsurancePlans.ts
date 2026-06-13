import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // The next migration makes the id deterministic and the primary key composite on
  // (patient_id, invoice_insurance_plan_id), so each pair must have exactly one row first.
  // The released insert-new-on-re-add behaviour can leave a live row plus soft-deleted
  // tombstones for the same pair. Keep the live row if one exists, otherwise the
  // soft-deleted row with the highest id (deterministic across servers since ids are synced).
  await query.sequelize.query(`
    DELETE FROM patient_invoice_insurance_plans
    WHERE id NOT IN (
      SELECT DISTINCT ON (patient_id, invoice_insurance_plan_id) id
      FROM patient_invoice_insurance_plans
      ORDER BY patient_id, invoice_insurance_plan_id, (deleted_at IS NULL) DESC, id DESC
    );
  `);

  // Remove changelog entries for the hard-deleted duplicates, including the delete
  // entries the audit trigger writes for the dedupe above.
  await query.sequelize.query(`
    DELETE FROM logs.changes
    WHERE table_name = 'patient_invoice_insurance_plans'
    AND record_id NOT IN (SELECT id FROM patient_invoice_insurance_plans);
  `);

  // Remove sync_lookup entries for the hard-deleted duplicates (orphans). Surviving rows'
  // entries are remapped to the new ids in the next migration, so no rebuild/re-pull is
  // needed — central only runs sync_lookup, on facilities this is a no-op.
  await query.sequelize.query(`
    DELETE FROM sync_lookup
    WHERE record_type = 'patient_invoice_insurance_plans'
    AND record_id NOT IN (SELECT id FROM patient_invoice_insurance_plans);
  `);
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: the duplicate (hard-deleted) rows and their changelog entries cannot be restored
}
