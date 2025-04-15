import { FACT_CURRENT_SYNC_TICK, SYSTEM_USER_UUID } from '@tamanu/constants';
import { QueryInterface, QueryTypes } from 'sequelize';

interface tableOid {
  oid: number;
}

export async function up(query: QueryInterface): Promise<void> {
  const [tableOidQuery]: any = await query.sequelize.query<tableOid>(
    `SELECT oid FROM pg_class WHERE relname = 'patient_program_registrations';`,
    { type: QueryTypes.SELECT },
  );
  const tableOid = tableOidQuery.oid;

  // Migrate historical changes to audit table
  await query.sequelize.query(`
    INSERT INTO logs.changes (
      table_oid,
      table_schema,
      table_name,
      logged_at,
      created_at,
      updated_at,
      deleted_at,
      updated_at_sync_tick,
      updated_by_user_id,
      record_id,
      record_update,
      record_data
    )
    SELECT
      ${tableOid},
      'public',
      'patient_program_registrations',
      to_timestamp(ppr.date, 'yyyy-mm-dd hh24:mi:ss'),
      now(),
      now(),
      CASE WHEN ppr.deleted_at IS NOT NULL THEN now() ELSE NULL END,
      (SELECT value FROM local_system_facts WHERE key = '${FACT_CURRENT_SYNC_TICK}')::bigint,
      COALESCE(ppr.clinician_id::text, '${SYSTEM_USER_UUID}'),
      ppr.id,
      registration_summary.is_insert,
      to_jsonb(ppr.*)
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
    ) registration_summary ON ppr.id = registration_summary.id;
  `);

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
    type: 'BOOLEAN',
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
