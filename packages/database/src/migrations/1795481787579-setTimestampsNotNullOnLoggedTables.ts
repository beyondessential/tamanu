import { QueryInterface } from 'sequelize';

// logs.record_change() copies a row's created_at / updated_at into logs.changes, where both are
// NOT NULL. A NULL in either on a logged table made the row impossible to update or hard-delete,
// failing at commit (the changelog trigger is deferred) with an error that doesn't name the
// table. Making the columns NOT NULL refuses such a row when it is written instead.
// 1795481786483-backfillNullTimestampsOnLoggedTables has already filled the existing NULLs.
//
// Backward compatibility: earlier releases never write a NULL timestamp to these tables.
// Sequelize fills createdAt / updatedAt on create (including sync's bulkCreate, which receives
// records without them), and raw inserts leave the columns to their DEFAULT. Data-migration
// tooling or manual SQL inserting an explicit NULL now fails, which is the intent.
//
// Performance: SET NOT NULL takes an ACCESS EXCLUSIVE lock and scans the table to validate.
// Both columns are altered in one statement so each table is scanned once. Migrations run in
// downtime, so the lock is uncontended.
const TABLES_WITH_NULLABLE_CREATED_AT = [
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
];

// These already had a NOT NULL created_at; only updated_at was nullable.
const TABLES_WITH_NULLABLE_UPDATED_AT_ONLY = [
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
  for (const table of TABLES_WITH_NULLABLE_CREATED_AT) {
    await query.sequelize.query(`
      ALTER TABLE "${table}"
        ALTER COLUMN created_at SET NOT NULL,
        ALTER COLUMN updated_at SET NOT NULL;
    `);
  }
  for (const table of TABLES_WITH_NULLABLE_UPDATED_AT_ONLY) {
    await query.sequelize.query(`ALTER TABLE "${table}" ALTER COLUMN updated_at SET NOT NULL;`);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of TABLES_WITH_NULLABLE_CREATED_AT) {
    await query.sequelize.query(`
      ALTER TABLE "${table}"
        ALTER COLUMN created_at DROP NOT NULL,
        ALTER COLUMN updated_at DROP NOT NULL;
    `);
  }
  for (const table of TABLES_WITH_NULLABLE_UPDATED_AT_ONLY) {
    await query.sequelize.query(`ALTER TABLE "${table}" ALTER COLUMN updated_at DROP NOT NULL;`);
  }
}
