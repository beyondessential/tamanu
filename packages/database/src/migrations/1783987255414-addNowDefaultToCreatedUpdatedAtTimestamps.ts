import { QueryInterface } from 'sequelize';

// These tables were created without a database-level default on their created_at / updated_at
// columns and relied solely on Sequelize stamping the values at the app layer. Add the now()
// default so rows inserted outside the ORM (migrations, manual SQL, bulk loads) still get valid
// timestamps, matching the convention used everywhere else.
const TABLES_MISSING_BOTH = [
  'ai_chat_sessions',
  'ai_documents',
  'appointment_procedure_types',
  'form_builder_chat_jobs',
  'imaging_type_external_codes',
  'local_system_facts',
  'local_system_secrets',
  'procedure_survey_responses',
  'user_leaves',
];

// These already default created_at; only updated_at is missing.
const TABLES_MISSING_UPDATED_AT = [
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

const ALL_TABLES = [...TABLES_MISSING_BOTH, ...TABLES_MISSING_UPDATED_AT];

function columnsFor(table: string): string[] {
  return TABLES_MISSING_UPDATED_AT.includes(table)
    ? ['updated_at']
    : ['created_at', 'updated_at'];
}

export async function up(query: QueryInterface): Promise<void> {
  for (const table of ALL_TABLES) {
    for (const column of columnsFor(table)) {
      await query.sequelize.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT now();`,
      );
    }
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of ALL_TABLES) {
    for (const column of columnsFor(table)) {
      await query.sequelize.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`,
      );
    }
  }
}
