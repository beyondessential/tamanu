/* eslint-disable no-unused-vars */
// remove the above line

import { DataTypes, QueryInterface, Sequelize, type TableName } from 'sequelize';

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
  'public.socket_io_attachments',
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

function toTableName(table: TableNameString): TableName {
  const [schema, tableName] = table.split('.');
  return { schema, tableName: tableName! };
}

async function changeUuidColumnDefault(
  query: QueryInterface,
  table: TableNameString,
  column: string,
  defaultFn: string,
  primaryKey = false,
) {
  await query.changeColumn(toTableName(table), column, {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey,
    defaultValue: Sequelize.fn(defaultFn),
  });
}

export async function up(query: QueryInterface): Promise<void> {
  for (const table of UUID_OSSP_TABLES) {
    await changeUuidColumnDefault(query, table, 'id', 'gen_random_uuid', true);
  }

  for (const table of FHIR_TABLES) {
    await changeUuidColumnDefault(query, table, 'version_id', 'gen_random_uuid');
  }

  await query.changeColumn(toTableName('fhir.jobs'), 'discriminant', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('gen_random_uuid'),
  });
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of UUID_OSSP_TABLES) {
    await changeUuidColumnDefault(query, table, 'id', 'uuid_generate_v4', true);
  }

  for (const table of FHIR_TABLES) {
    await changeUuidColumnDefault(query, table, 'version_id', 'uuid_generate_v4');
  }

  await query.changeColumn(toTableName('fhir.jobs'), 'discriminant', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  });
}
