import { FACT_CURRENT_SYNC_TICK, SYSTEM_USER_UUID } from '@tamanu/constants';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import config from 'config';
import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';
import { pauseAudit } from '../utils/audit/pauseAudit';

interface tableOid {
  oid: number;
}

export async function up(query: QueryInterface): Promise<void> {
  const PRIMARY_TIME_ZONE = config?.primaryTimeZone;

  if (!PRIMARY_TIME_ZONE) {
    throw Error('A primaryTimeZone must be configured in local.json5 for this migration to run.');
  }

  // Save previously set time zone
  const previousTimeZoneQuery: any = await query.sequelize.query('show timezone');
  const previousTimeZone = previousTimeZoneQuery[0].TimeZone;

  // Set time zone defined in config
  await query.sequelize.query(`SET timezone to '${PRIMARY_TIME_ZONE}'`);

  const [tableOidQuery]: any = await query.sequelize.query<tableOid>(
    `SELECT oid FROM pg_class WHERE relname = 'patient_program_registrations';`,
    { type: QueryTypes.SELECT },
  );
  const tableOid = tableOidQuery.oid;

  // Check if updated_at_sync_tick exists in logs.changes
  const [changesUpdatedAtSyncTickQuery]: any = await query.sequelize.query(`
    SELECT EXISTS (SELECT TRUE
    FROM information_schema.columns
    WHERE table_schema = 'logs' AND table_name = 'changes' AND column_name = 'updated_at_sync_tick');
  `);
  const changesHasUpdatedAtSyncTick = changesUpdatedAtSyncTickQuery?.[0]?.exists;
  const updatedAtSyncTickSelect = `(SELECT value FROM local_system_facts WHERE key = '${FACT_CURRENT_SYNC_TICK}')::bigint,`;

  // Check if updated_at_sync_tick exists in patient_program_registrations
  const [pprUpdatedAtSyncTickQuery]: any = await query.sequelize.query(`
    SELECT EXISTS (SELECT TRUE
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patient_program_registrations' AND column_name = 'updated_at_sync_tick');
  `);
  const pprHasUpdatedAtSyncTick = pprUpdatedAtSyncTickQuery?.[0]?.exists;
  const isFacilityServer = !!selectFacilityIds(config);
  const syncTickInitialValue = isFacilityServer ? '-999,' : '0,';

  // Migrate historical changes to audit table
  await query.sequelize.query(`
    INSERT INTO logs.changes (
      id,
      table_oid,
      table_schema,
      table_name,
      logged_at,
      created_at,
      updated_at,
      deleted_at,
      ${changesHasUpdatedAtSyncTick ? 'updated_at_sync_tick,' : ''}
      updated_by_user_id,
      record_id,
      record_update,
      record_created_at,
      record_updated_at,
      record_deleted_at,
      record_sync_tick,
      record_data
    )
    SELECT
      uuid_generate_v5(uuid_generate_v5(uuid_nil(), 'patient_program_registrations'), ppr.id::text),
      ${tableOid},
      'public',
      'patient_program_registrations',
      to_timestamp(ppr.date, 'yyyy-mm-dd hh24:mi:ss'),
      now(),
      now(),
      CASE WHEN ppr.deleted_at IS NOT NULL THEN now() ELSE NULL END,
      ${changesHasUpdatedAtSyncTick ? updatedAtSyncTickSelect : ''}
      COALESCE(ppr.clinician_id::text, '${SYSTEM_USER_UUID}'),
      latest_registrations.latest_registration_id,
      NOT registration_summary.is_insert,
      ppr.created_at,
      ppr.updated_at,
      ppr.deleted_at,
      ${pprHasUpdatedAtSyncTick ? 'ppr.updated_at_sync_tick,' : syncTickInitialValue}
      to_jsonb((
      SELECT row_to_json(ppr_with_min_date.*)
      FROM (
           SELECT
               *,
               MIN(date) OVER (PARTITION BY patient_id, program_registry_id) AS date
           FROM patient_program_registrations
       ) ppr_with_min_date WHERE ppr_with_min_date.id = ppr.id
        ))
    FROM patient_program_registrations ppr
    JOIN (
      SELECT
        id,
        CASE
          WHEN ROW_NUMBER() OVER (
            PARTITION BY "patient_id", "program_registry_id"
            ORDER BY date ASC
          ) = 1 THEN TRUE
          ELSE FALSE
        END AS is_insert
      FROM patient_program_registrations
      ORDER BY patient_id, program_registry_id, date ASC
    ) registration_summary ON ppr.id = registration_summary.id
    JOIN (
      SELECT DISTINCT ON (patient_id, program_registry_id)
        patient_id,
        program_registry_id,
        id as latest_registration_id
      FROM patient_program_registrations
      WHERE is_most_recent = TRUE
      ORDER BY patient_id, program_registry_id, date DESC
    ) latest_registrations ON ppr.patient_id = latest_registrations.patient_id AND ppr.program_registry_id = latest_registrations.program_registry_id
  `);

  // Disable audit changes
  await pauseAudit(query.sequelize);

  await query.sequelize.query(`
    UPDATE patient_program_registrations ppr
    SET date = subquery.min_date
    FROM (
      SELECT patient_id, program_registry_id, MIN(date) as min_date
      FROM patient_program_registrations
      GROUP BY patient_id, program_registry_id
    ) subquery
    WHERE ppr.patient_id = subquery.patient_id
    AND ppr.program_registry_id = subquery.program_registry_id
    AND ppr.is_most_recent = true;
  `);

  // Reset time zone for containment
  await query.sequelize.query(`SET timezone to '${previousTimeZone}'`);

  // Remove all non recent registrations (this bit destructive, can't be downed)
  await query.sequelize.query(`
    DELETE FROM patient_program_registrations
    WHERE is_most_recent = FALSE;
  `);

  // Update schema
  await query.removeColumn('patient_program_registrations', 'is_most_recent');
}

export async function down(query: QueryInterface): Promise<void> {
  // Add the is_most_recent column back
  await query.addColumn('patient_program_registrations', 'is_most_recent', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  // Set all to be true
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET is_most_recent = TRUE;
  `);

  // Remove historical records from audit table
  await query.sequelize.query(`
    DELETE FROM logs.changes
    WHERE table_name = 'patient_program_registrations'
  `);
}
