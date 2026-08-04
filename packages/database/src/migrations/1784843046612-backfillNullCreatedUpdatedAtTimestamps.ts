import { QueryInterface } from 'sequelize';

// #10364 added DEFAULT now() to created_at / updated_at on these tables, but rows inserted
// outside the ORM before that (data migrations, manual SQL, bulk loads) still carry NULLs.
// Backfill each NULL from the sibling timestamp where available, falling back to now().
//
// Sync: created_at / updated_at are in COLUMNS_EXCLUDED_FROM_SYNC, so these values are
// per-server and never propagate — every server heals its own rows when it runs this. No sync
// churn either: runPreMigration drops the set_updated_at_sync_tick triggers while migrations
// run, so ticks are untouched and nothing gets re-queued.
//
// Performance:
// - Each UPDATE touches only rows with a NULL timestamp, so work is bounded by the actual bad
//   rows; on servers with none it's a no-op.
// - None of these tables are FHIR upstreams, so no rematerialisation is triggered.
const TABLES = [
  'ai_chat_sessions',
  'ai_documents',
  'appointment_procedure_types',
  'form_builder_chat_jobs',
  'imaging_type_external_codes',
  'local_system_facts',
  'local_system_secrets',
  'procedure_survey_responses',
  'user_leaves',
  'invoice_discounts',
  'invoice_insurer_payments',
  'invoice_item_discounts',
  'invoice_items',
  'invoice_patient_payments',
  'invoice_payments',
  'invoice_products',
  'invoices',
  'ips_requests',
];

export async function up(query: QueryInterface): Promise<void> {
  for (const table of TABLES) {
    // The set_updated_at BEFORE UPDATE trigger (which stays active during migrations, unlike
    // the sync tick ones) re-stamps updated_at to current_timestamp whenever other columns
    // change but updated_at doesn't. For rows where only created_at is NULL we want to keep
    // the row's genuine updated_at rather than stamping migration-run time, so nudge it by
    // 1 microsecond — a changed value passes through the trigger untouched.
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
