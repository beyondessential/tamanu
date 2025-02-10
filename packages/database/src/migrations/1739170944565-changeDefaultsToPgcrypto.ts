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
  'public.local_system_facts',
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

function toTableName(table: TableNameString): TableName {
  const [schema, tableName] = table.split('.');
  return { schema, tableName: tableName! };
}

export async function up(query: QueryInterface): Promise<void> {
  for (const table of STRING_OSSP_TABLES) {
    await query.changeColumn(toTableName(table), 'id', {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    });
  }

  for (const table of UUID_OSSP_TABLES) {
    await query.changeColumn(toTableName(table), 'id', {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    });
  }

  for (const table of FHIR_TABLES) {
    await query.changeColumn(toTableName(table), 'version_id', {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    });
  }

  await query.changeColumn(toTableName('public.user_localisation_caches'), 'id', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('gen_random_uuid'),
  });

  await query.changeColumn(toTableName('public.one_time_logins'), 'id', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('gen_random_uuid'),
  });

  await query.changeColumn(toTableName('public.imaging_requests'), 'display_id', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('gen_random_uuid'),
  });

  await query.changeColumn(toTableName('fhir.jobs'), 'discriminant', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('gen_random_uuid'),
  });
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of STRING_OSSP_TABLES) {
    await query.changeColumn(toTableName(table), 'id', {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    });
  }

  for (const table of UUID_OSSP_TABLES) {
    await query.changeColumn(toTableName(table), 'id', {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    });
  }

  for (const table of FHIR_TABLES) {
    await query.changeColumn(toTableName(table), 'version_id', {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    });
  }

  await query.changeColumn(toTableName('public.user_localisation_caches'), 'id', {
    type: DataTypes.TEXT,
    allowNull: false,
  });

  await query.changeColumn(toTableName('public.one_time_logins'), 'id', {
    type: DataTypes.TEXT,
    allowNull: false,
  });

  await query.changeColumn(toTableName('public.imaging_requests'), 'display_id', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  });

  await query.changeColumn(toTableName('fhir.jobs'), 'discriminant', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  });
}
