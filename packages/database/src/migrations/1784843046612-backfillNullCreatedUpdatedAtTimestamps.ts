import { QueryInterface } from 'sequelize';

// #10364 added DEFAULT now() to created_at / updated_at on these tables, but rows inserted
// outside the ORM before that (data migrations, manual SQL, bulk loads) still carry NULLs.
// Backfill each NULL from the sibling timestamp where available, so the value is deterministic
// and identical on every server, falling back to now().
//
// Performance:
// - Each UPDATE touches only rows with a NULL timestamp, so work is bounded by the actual bad
//   rows; on servers with none it's a no-op.
// - The sync tick trigger re-stamps touched rows, so they re-sync once. That's deliberate: it
//   refreshes sync_lookup with the fixed values, and whichever server migrates first (central,
//   in practice) syncs the fix to the rest — by the time other servers run this, their WHERE
//   matches few or no rows.
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
    // The set_updated_at BEFORE UPDATE trigger re-stamps updated_at to current_timestamp
    // whenever other columns change but updated_at doesn't. For rows where only created_at is
    // NULL we want to keep the existing updated_at, so nudge it by 1 microsecond — a changed
    // value passes through the trigger untouched, stays deterministic across servers, and
    // preserves the history.
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
