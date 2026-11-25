import { QueryInterface } from 'sequelize';

// logs.record_change() copies a row's created_at / updated_at into logs.changes, where both are
// NOT NULL, so a row with either one NULL in a logged table can never be updated or hard-deleted.
// Backfill them ahead of 1795481787579-setTimestampsNotNullOnLoggedTables, which tightens the
// columns so such rows are refused when they are written instead. This is the same backfill as
// 1784843046612-backfillNullCreatedUpdatedAtTimestamps, for the logged tables it didn't cover.
//
// Sync: created_at / updated_at are in COLUMNS_EXCLUDED_FROM_SYNC, so these values are
// per-server and never propagate. Every server heals its own rows when it runs this. The sync
// tick trigger is disabled while migrations run, so nothing is re-queued for sync.
//
// Performance: each UPDATE scans its table once but writes only rows with a NULL timestamp, so
// everything a row update sets off (changelog entries, sync lookup rebuild flags, change
// notifications such as FHIR refreshes) is bounded by the actual bad rows. On servers with none,
// nothing is written.
const TABLES = [
  // created_at and updated_at both nullable
  'appointments',
  'assets',
  'attachments',
  'certificate_notifications',
  'contributing_death_causes',
  'departments',
  'discharges',
  'document_metadata',
  'facilities',
  'lab_request_logs',
  'locations',
  'patient_additional_data',
  'patient_death_data',
  'patient_facilities',
  'patient_secondary_ids',
  'permissions',
  'report_definition_versions',
  'report_definitions',
  'roles',
  'templates',
  'user_facilities',
  // only updated_at nullable
  'invoice_discounts',
  'invoice_insurance_plan_payments',
  'invoice_item_discounts',
  'invoice_items',
  'invoice_patient_payments',
  'invoice_payments',
  'invoice_products',
  'invoices',
];

export async function up(query: QueryInterface): Promise<void> {
  for (const table of TABLES) {
    // The set_updated_at BEFORE UPDATE trigger re-stamps updated_at to current_timestamp
    // whenever other columns change but updated_at doesn't. For rows where only created_at is
    // NULL, keep the row's genuine updated_at rather than stamping migration-run time by
    // nudging it 1 microsecond: a changed value passes through the trigger untouched.
    await query.sequelize.query(`
      UPDATE "${table}"
      SET
        created_at = COALESCE(created_at, updated_at, now()),
        updated_at = CASE
          WHEN updated_at IS NULL THEN COALESCE(created_at, now())
          ELSE updated_at + interval '1 microsecond'
        END
      WHERE created_at IS NULL OR updated_at IS NULL;
    `);
  }
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: there is no record of which rows were backfilled, so the NULLs cannot be
  // restored. The backfilled values are valid timestamps either way.
}
