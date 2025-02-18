import { QueryInterface } from 'sequelize';

function addDefaultsQuery(table: `${string}.${string}`, column: 'created_at' | 'updated_at') {
  return `ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT CURRENT_TIMESTAMP`;
}

function removeDefaultsQuery(table: `${string}.${string}`, column: 'created_at' | 'updated_at') {
  return `ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT`;
}

/*
select pg_class.relnamespace::regnamespace || '.' || pg_class.relname as t
from pg_attribute join pg_class on attrelid = pg_class.oid left join pg_attrdef on adrelid = pg_class.oid and adnum = attnum
where attname = 'created_at' and atttypid = 'timestamptz'::regtype::oid and reltype != 0 and pg_attrdef.oid is null
order by t;
*/
const TABLES_WITHOUT_DATE_DEFAULTS: `${string}.${string}`[] = [
  'public.administered_vaccines',
  'public.appointments',
  'public.assets',
  'public.attachments',
  'public.certifiable_vaccines',
  'public.certificate_notifications',
  'public.contributing_death_causes',
  'public.departments',
  'public.discharges',
  'public.document_metadata',
  'public.encounter_diagnoses',
  'public.encounter_medications',
  'public.encounters',
  'public.facilities',
  'public.imaging_area_external_codes',
  'public.imaging_request_areas',
  'public.imaging_requests',
  'public.lab_request_logs',
  'public.lab_requests',
  'public.lab_test_types',
  'public.lab_tests',
  'public.location_groups',
  'public.locations',
  'public.note_items',
  'public.note_pages',
  'public.notes',
  'public.notes_legacy',
  'public.one_time_logins',
  'public.patient_additional_data',
  'public.patient_allergies',
  'public.patient_birth_data',
  'public.patient_care_plans',
  'public.patient_communications',
  'public.patient_conditions',
  'public.patient_contacts',
  'public.patient_death_data',
  'public.patient_facilities',
  'public.patient_family_histories',
  'public.patient_field_definition_categories',
  'public.patient_field_definitions',
  'public.patient_field_values',
  'public.patient_issues',
  'public.patient_secondary_ids',
  'public.patient_vrs_data',
  'public.patients',
  'public.permissions',
  'public.procedures',
  'public.program_data_elements',
  'public.programs',
  'public.reference_data',
  'public.referrals',
  'public.refresh_tokens',
  'public.report_definition_versions',
  'public.report_definitions',
  'public.report_requests',
  'public.roles',
  'public.scheduled_vaccines',
  'public.signers',
  'public.survey_response_answers',
  'public.survey_responses',
  'public.survey_screen_components',
  'public.surveys',
  'public.sync_sessions',
  'public.triages',
  'public.user_facilities',
  'public.user_localisation_caches',
  'public.users',
  'public.vital_logs',
  'public.vitals',
];

export async function up(query: QueryInterface): Promise<void> {
  for (const table of TABLES_WITHOUT_DATE_DEFAULTS) {
    await query.sequelize.query(addDefaultsQuery(table, 'created_at'));
    await query.sequelize.query(addDefaultsQuery(table, 'updated_at'));
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of TABLES_WITHOUT_DATE_DEFAULTS) {
    await query.sequelize.query(removeDefaultsQuery(table, 'created_at'));
    await query.sequelize.query(removeDefaultsQuery(table, 'updated_at'));
  }
}
