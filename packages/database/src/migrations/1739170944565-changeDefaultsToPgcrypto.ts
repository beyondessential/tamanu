import { QueryInterface } from 'sequelize';
import config from 'config';

type TableNameString = `${string}.${string}`;

/*
select pg_class.relnamespace::regnamespace || '.' || pg_class.relname as t
from pg_attribute join pg_class on attrelid = pg_class.oid
where attname = 'id' and atttypid = 'uuid'::regtype::oid and reltype != 0
order by t;
*/
const UUID_OSSP_TABLES: TableNameString[] = [
  'fhir.encounters',
  'fhir.immunizations',
  'fhir.job_workers',
  'fhir.jobs',
  'fhir.non_fhir_medici_report',
  'fhir.organizations',
  'fhir.patients',
  'fhir.practitioners',
  'fhir.service_requests',
  'fhir.specimens',
  'logs.debug_logs',
  'logs.fhir_writes',
  'public.appointment_schedules',
  'public.death_revert_logs',
  'public.encounter_diets',
  'public.encounter_history',
  'public.imaging_results',
  'public.invoice_discounts',
  'public.invoice_insurer_payments',
  'public.invoice_insurers',
  'public.invoice_item_discounts',
  'public.invoice_items',
  'public.invoice_patient_payments',
  'public.invoice_payments',
  'public.invoices',
  'public.lab_test_panel_requests',
  'public.note_items',
  'public.note_pages',
  'public.notes',
  'public.notifications',
  'public.patient_program_registrations',
  'public.reference_data_relations',
  'public.refresh_tokens',
  'public.settings',
  'public.sync_sessions',
  'public.task_designations',
  'public.task_template_designations',
  'public.task_templates',
  'public.tasks',
  'public.templates',
  'public.user_designations',
  'public.user_recently_viewed_patients',
];

const FHIR_TABLES = UUID_OSSP_TABLES.filter(
  (table) => table.startsWith('fhir.') && !['fhir.jobs', 'fhir.job_workers'].includes(table),
);

/*
select pg_class.relnamespace::regnamespace || '.' || pg_class.relname as t
from pg_attrdef join pg_class on adrelid = pg_class.oid
where pg_get_expr(adbin, adrelid) = 'uuid_generate_v4()' and adnum = 1
order by t;
*/
const STRING_OSSP_TABLES: TableNameString[] = [
  'public.imaging_area_external_codes',
  'public.imaging_requests',
  'public.ips_requests',
  'public.lab_request_attachments',
  'public.lab_test_panels',
  'public.patient_contacts',
  'public.patient_program_registration_conditions',
  'public.program_registries',
  'public.program_registry_clinical_statuses',
  'public.program_registry_conditions',
  'public.vital_logs',
];

/*
select pg_class.relnamespace::regnamespace || '.' || pg_class.relname as t
from pg_attribute join pg_class on attrelid = pg_class.oid
where attname = 'id' and atttypid = 'character varying'::regtype::oid and reltype != 0
order by t;
-- and then deduplicated with STRING_OSSP_TABLES
*/
const STRING_NO_DEFAULT_TABLES: TableNameString[] = [
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
  'public.imaging_request_areas',
  'public.invoice_products',
  'public.lab_request_logs',
  'public.lab_requests',
  'public.lab_test_types',
  'public.lab_tests',
  'public.local_system_facts',
  'public.location_groups',
  'public.locations',
  'public.notes_legacy',
  'public.one_time_logins',
  'public.patient_allergies',
  'public.patient_care_plans',
  'public.patient_communications',
  'public.patient_conditions',
  'public.patient_death_data',
  'public.patient_family_histories',
  'public.patient_field_definition_categories',
  'public.patient_field_definitions',
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
  'public.triages',
  'public.user_facilities',
  'public.user_localisation_caches',
  'public.users',
  'public.vitals',
];

// Sequelize always wants us to have the type, and then issues type-change alters
// but in postgres we can absolutely have default changes without altering type.

function changeDefaultQuery(table: string, column: string, defaultFn: string) {
  return `ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT ${defaultFn}();`;
}

function removeDefaultQuery(table: string, column: string) {
  return `ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT;`;
}

const isFacility = config.serverFacilityId || config.serverFacilityIds;

export async function up(query: QueryInterface): Promise<void> {
  for (const table of STRING_OSSP_TABLES.concat(STRING_NO_DEFAULT_TABLES, UUID_OSSP_TABLES)) {
    await query.sequelize.query(changeDefaultQuery(table, 'id', 'gen_random_uuid'));
  }

  for (const table of FHIR_TABLES) {
    await query.sequelize.query(changeDefaultQuery(table, 'version_id', 'gen_random_uuid'));
  }

  await query.sequelize.query(changeDefaultQuery('fhir.jobs', 'discriminant', 'gen_random_uuid'));
  await query.sequelize.query(
    changeDefaultQuery('public.imaging_requests', 'display_id', 'gen_random_uuid'),
  );

  if (!isFacility) {
    await query.sequelize.query(
      changeDefaultQuery('public.socket_io_attachments', 'id', 'gen_random_uuid'),
    );
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of STRING_OSSP_TABLES.concat(UUID_OSSP_TABLES)) {
    await query.sequelize.query(changeDefaultQuery(table, 'id', 'uuid_generate_v4'));
  }

  for (const table of STRING_NO_DEFAULT_TABLES) {
    await query.sequelize.query(removeDefaultQuery(table, 'id'));
  }

  for (const table of FHIR_TABLES) {
    await query.sequelize.query(changeDefaultQuery(table, 'version_id', 'uuid_generate_v4'));
  }

  await query.sequelize.query(changeDefaultQuery('fhir.jobs', 'discriminant', 'uuid_generate_v4'));
  await query.sequelize.query(
    changeDefaultQuery('public.imaging_requests', 'display_id', 'uuid_generate_v4'),
  );

  if (!isFacility) {
    await query.sequelize.query(
      changeDefaultQuery('public.socket_io_attachments', 'id', 'uuid_generate_v4'),
    );
  }
}
