import { DataTypes, QueryInterface } from 'sequelize';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  // Migrate encounter_history data to logs.changes table
  await query.sequelize.query(`
    INSERT INTO logs.changes (
      id,
      table_oid,
      table_schema,
      table_name,
      logged_at,
      updated_by_user_id,
      device_id,
      version,
      record_id,
      record_created_at,
      record_updated_at,
      record_deleted_at,
      record_data,
      reason,
      updated_at_sync_tick
    )
    SELECT 
      gen_random_uuid() as id,
      (SELECT oid FROM pg_class WHERE relname = 'encounters') as table_oid,
      'public' as table_schema,
      'encounters' as table_name,
      eh.date::timestamp as logged_at,
      COALESCE(eh.actor_id, eh.examiner_id, '${SYSTEM_USER_UUID}') as updated_by_user_id,
      'unknown' as device_id,
      'unknown' as version,
      eh.encounter_id as record_id,
      eh.created_at as record_created_at,
      eh.updated_at as record_updated_at,
      eh.deleted_at as record_deleted_at,
      jsonb_build_object(
        'id', eh.encounter_id,
        'encounterType', eh.encounter_type,
        'locationId', eh.location_id,
        'departmentId', eh.department_id,
        'examinerId', eh.examiner_id,
        'startDate', e.start_date,
        'endDate', e.end_date,
        'patientId', e.patient_id
      ) as record_data,
      eh.change_type as reason,
      eh.updated_at_sync_tick
    FROM encounter_history eh
    LEFT JOIN encounters e ON e.id = eh.encounter_id
    WHERE eh.deleted_at IS NULL
  `);

  // After data migration is complete, drop the encounter_history table
  await query.dropTable('encounter_history');

  /**
   * Have you handled the state of the sync_lookup table after running this migration?
   * You can add the following query to rebuild the lookup table for the tables you have modified:
   */
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('encounters');`);

  // Note: On larger tables this may have a performance impact that should be considered.
}

export async function down(query: QueryInterface): Promise<void> {
  // Reverse migration - remove encounter_history data from logs.changes
  await query.sequelize.query(`
    DELETE FROM logs.changes 
    WHERE table_name = 'encounters' 
    AND reason IN ('encounter_type', 'location', 'department', 'examiner')
  `);

  // Recreate encounter_history table structure
  await query.createTable('encounter_history', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date: {
      type: DataTypes.STRING(19),
      allowNull: false,
    },
    encounter_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'encounters',
        key: 'id',
      },
    },
    examiner_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    department_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    location_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    encounter_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    actor_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    change_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    updated_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: -999,
    },
  });
}
