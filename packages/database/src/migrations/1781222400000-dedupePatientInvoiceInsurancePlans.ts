import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // The next migration makes the id deterministic and the primary key composite on
  // (patient_id, invoice_insurance_plan_id), so each pair must have exactly one row first.
  // The released insert-new-on-re-add behaviour can leave a live row plus soft-deleted
  // tombstones for the same pair. Keep the live row if one exists, otherwise the
  // soft-deleted row with the highest id (deterministic across servers since ids are synced).
  //
  // Their changelog (logs.changes) and sync_lookup entries are removed by record_id, not by
  // table_name/record_type: neither large table is usefully indexed on its type column
  // (sync_lookup is unique on (record_id, record_type); logs.changes has a hash index on
  // record_id), so driving both deletes off the small set of just-deleted ids stays
  // index-assisted and avoids a sequential scan of millions of rows. Chained data-modifying
  // CTEs share that id set without a temp table or recomputing the survivor query. Surviving
  // rows' sync_lookup entries are remapped to the new ids in the next migration, so no
  // rebuild/re-pull is needed — and on facilities (no sync_lookup rows) it is a no-op.
  await query.sequelize.query(`
    WITH deleted_duplicates AS (
      DELETE FROM patient_invoice_insurance_plans
      WHERE id NOT IN (
        SELECT DISTINCT ON (patient_id, invoice_insurance_plan_id) id
        FROM patient_invoice_insurance_plans
        ORDER BY patient_id, invoice_insurance_plan_id, (deleted_at IS NULL) DESC, id DESC
      )
      RETURNING id
    ),
    cleared_sync_lookup AS (
      DELETE FROM sync_lookup
      WHERE record_id IN (SELECT id FROM deleted_duplicates)
        AND record_type = 'patient_invoice_insurance_plans'
    )
    DELETE FROM logs.changes
    WHERE record_id IN (SELECT id FROM deleted_duplicates)
      AND table_name = 'patient_invoice_insurance_plans';
  `);
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: the duplicate (hard-deleted) rows and their changelog entries cannot be restored
}
