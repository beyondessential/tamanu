import { QueryInterface } from 'sequelize';

// Existing UNIQUE constraints (pg_constraint contype='u') on syncable tables. Converted
// to DEFERRABLE INITIALLY IMMEDIATE so withDeferredSyncSafeguards can defer their
// validation to the end of the sync-apply transaction, same as the self-referencing FK
// fix in 1771485087000-makeSelfReferencingFKDeferrable.ts. See TAM-7004.
//
// Deliberately excludes unique constraints/indexes on `id` alone (e.g.
// ai_documents_id_key, patient_ongoing_prescriptions_id_key,
// patient_program_registrations_id_key): id is the primary discriminator during sync,
// so a duplicate id indicates a real bug rather than the benign rename/reuse ordering
// issue this migration targets. Some of these are also relied on as foreign key
// targets (e.g. patient_program_registration_conditions -> patient_program_registrations),
// so dropping them would require dropping and recreating the referencing FK too.
//
// sync_lookup is NOT included here at all: SyncLookup.syncDirection is DO_NOT_SYNC (it's
// sync's own bookkeeping table, not a synced table itself), so it's out of scope by
// definition — this migration only targets tables that actually sync. It also happens to
// be used as the ON CONFLICT arbiter for an `INSERT ... ON CONFLICT (record_id,
// record_type) DO UPDATE` in packages/central-server/app/sync/updateLookupTable.js — if
// sync_lookup ever became syncable, that call site would need rewriting first, same as
// invoice_items did below.
//
// Also excludes patient_facilities_patient_id_facility_id_key: it's the ON CONFLICT
// arbiter for `INSERT ... ON CONFLICT (patient_id, facility_id) DO NOTHING` in
// onCreateEncounterMarkPatientForSync.ts. Unlike DO UPDATE, DO NOTHING *can* drop the
// conflict target, but Postgres only skips the deferrable-arbiter restriction when a
// non-deferrable index (here, the patient_facilities_pkey on (facility_id, patient_id))
// happens to catch the conflict first — for a genuinely new patient+facility pairing
// (the common case), Postgres still errors trying to speculatively insert against the
// deferrable index. A `WHERE NOT EXISTS` rewrite avoids that, but introduces a real
// check-then-insert race under concurrent encounter creation for the same pairing
// (confirmed via existing tests that create encounters concurrently) — since the PK
// itself is non-deferrable and checked immediately, even a savepoint-wrapped rewrite
// to swallow the resulting unique violation adds meaningful complexity for a rare
// scenario. Left as-is for now.
const EXISTING_UNIQUE_CONSTRAINTS = [
  {
    table: 'certifiable_vaccines',
    columns: ['vaccine_id'],
    name: 'certifiable_vaccines_unique_vaccine_id',
  },
  {
    table: 'imaging_area_external_codes',
    columns: ['area_id'],
    name: 'imaging_area_external_codes_area_id_key',
  },
  {
    table: 'invoice_insurer_payments',
    columns: ['invoice_payment_id'],
    name: 'invoice_insurer_payments_invoice_payment_id_key',
  },
  {
    table: 'invoice_patient_payments',
    columns: ['invoice_payment_id'],
    name: 'invoice_patient_payments_invoice_payment_id_key',
  },
  {
    table: 'invoice_payments',
    columns: ['original_payment_id'],
    name: 'invoice_payments_original_payment_id_key',
  },
  {
    table: 'invoice_products',
    columns: ['source_record_id', 'source_record_type'],
    name: 'invoice_products_source_record_id_source_record_type_unique',
  },
  { table: 'locations', columns: ['code'], name: 'locations_code_key' },
  { table: 'patients', columns: ['display_id'], name: 'patients_display_id_key' },
  { table: 'portal_users', columns: ['email'], name: 'portal_users_email_key' },
  {
    table: 'procedure_survey_responses',
    columns: ['procedure_id', 'survey_response_id'],
    name: 'unique_procedure_survey_response',
  },
  {
    table: 'procedure_type_surveys',
    columns: ['procedure_type_id', 'survey_id'],
    name: 'procedure_type_survey_unique',
  },
  { table: 'program_registries', columns: ['code'], name: 'program_registries_code_key' },
  {
    table: 'program_registry_clinical_statuses',
    columns: ['code'],
    name: 'program_registry_clinical_statuses_code_key',
  },
  {
    table: 'program_registry_conditions',
    columns: ['code'],
    name: 'program_registry_conditions_code_key',
  },
  {
    table: 'reference_data_relations',
    columns: ['reference_data_id', 'reference_data_parent_id', 'type'],
    name: 'reference_data_relations_unique_index',
  },
  {
    table: 'reference_drugs',
    columns: ['reference_data_id'],
    name: 'reference_drugs_reference_data_id_key',
  },
  { table: 'report_definitions', columns: ['name'], name: 'report_definitions_name_key' },
  {
    table: 'settings',
    columns: ['key', 'facility_id'],
    name: 'settings_alive_key_unique_cnt',
  },
  {
    table: 'task_templates',
    columns: ['reference_data_id'],
    name: 'task_templates_reference_data_id_key',
  },
  {
    table: 'user_facilities',
    columns: ['user_id', 'facility_id'],
    name: 'user_facilities_user_id_facility_id_key',
  },
  { table: 'users', columns: ['email'], name: 'users_email_key' },
];

// Plain UNIQUE indexes (no backing pg_constraint) on syncable tables. Promoted to
// full UNIQUE constraints (reusing the same name) so they can be made deferrable —
// Postgres only supports DEFERRABLE on constraints, not bare indexes. See TAM-7004.
//
// A further 6 unique indexes on syncable tables (patient_invoice_insurance_plans,
// permissions x2, settings x2, user_preferences) are intentionally excluded here: they
// are partial or expression-based, which Postgres cannot express as a plain UNIQUE
// constraint at all (only a DEFERRABLE EXCLUDE ... USING gist constraint could), so
// they're left as-is for a follow-up ticket. The uniqueConstraintDeferrability guard
// test whitelists these same 6 by name.
const PLAIN_UNIQUE_INDEXES = [
  {
    table: 'appointment_procedure_types',
    columns: ['appointment_id', 'procedure_type_id'],
    name: 'unique_appointment_procedure_type',
  },
  {
    table: 'invoice_insurance_plan_items',
    columns: ['invoice_product_id', 'invoice_insurance_plan_id'],
    name: 'idx_invoice_insurance_plan_items_invoice_product_id_invoice_ins',
  },
  {
    table: 'invoice_insurance_plans',
    columns: ['code'],
    name: 'idx_invoice_insurance_plans_code_unique',
  },
  {
    table: 'invoice_item_finalised_insurances',
    columns: ['invoice_item_id', 'invoice_insurance_plan_id'],
    name: 'idx_invoice_item_finalised_insurances_id_plan_id_unique',
  },
  {
    table: 'invoice_items',
    columns: ['invoice_id', 'source_record_type', 'source_record_id'],
    name: 'invoice_items_invoice_id_source_record_type_source_record_id_un',
  },
  {
    table: 'invoice_price_list_items',
    columns: ['invoice_price_list_id', 'invoice_product_id'],
    name: 'idx_invoice_price_list_items_price_list_id_invoice_product_id_u',
  },
  {
    table: 'invoice_price_lists',
    columns: ['code'],
    name: 'idx_invoice_price_lists_code_unique',
  },
  {
    table: 'program_registry_condition_categories',
    columns: ['program_registry_id', 'code'],
    name: 'program_registry_condition_categories_program_registry_id_code',
  },
];

export async function up(query: QueryInterface): Promise<void> {
  for (const { table, columns, name } of EXISTING_UNIQUE_CONSTRAINTS) {
    // Have to drop the constraint first because it's not possible to alter a
    // non-deferrable constraint to be deferrable
    await query.sequelize.query(`
      ALTER TABLE ${table}
      DROP CONSTRAINT ${name};
    `);
    await query.sequelize.query(`
      ALTER TABLE ${table}
      ADD CONSTRAINT ${name}
        UNIQUE (${columns.join(', ')})
        DEFERRABLE INITIALLY IMMEDIATE;
    `);
  }

  for (const { table, columns, name } of PLAIN_UNIQUE_INDEXES) {
    // Dropping the index frees up its name, which we reuse for the replacement constraint
    await query.sequelize.query(`
      DROP INDEX ${name};
    `);
    await query.sequelize.query(`
      ALTER TABLE ${table}
      ADD CONSTRAINT ${name}
        UNIQUE (${columns.join(', ')})
        DEFERRABLE INITIALLY IMMEDIATE;
    `);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const { table, columns, name } of PLAIN_UNIQUE_INDEXES) {
    await query.sequelize.query(`
      ALTER TABLE ${table}
      DROP CONSTRAINT ${name};
    `);
    await query.sequelize.query(`
      CREATE UNIQUE INDEX ${name}
      ON ${table} (${columns.join(', ')});
    `);
  }

  for (const { table, columns, name } of EXISTING_UNIQUE_CONSTRAINTS) {
    await query.sequelize.query(`
      ALTER TABLE ${table}
      DROP CONSTRAINT ${name};
    `);
    await query.sequelize.query(`
      ALTER TABLE ${table}
      ADD CONSTRAINT ${name}
        UNIQUE (${columns.join(', ')});
    `);
  }
}
