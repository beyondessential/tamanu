import { DataTypes, QueryInterface, Sequelize } from 'sequelize';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_facilities', 'last_interacted_time', {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn('now'),
  });

  await query.addColumn('patient_facilities', 'created_at_sync_tick', {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: Sequelize.cast(
      Sequelize.fn('local_system_fact', FACT_CURRENT_SYNC_TICK, '0'),
      'bigint',
    ),
  });

  await query.addIndex('patient_facilities', ['facility_id', 'last_interacted_time']);
  await query.addIndex('patient_facilities', ['facility_id', 'created_at_sync_tick']);

  // Query uses limited syntax to match mobile sqlite migration query
  // Calculate last interaction time based on:
  // - Encounters in that facility for that patient
  // - Program registrations in that facility for that patient
  // - If no interaction time is found, use the patient facility creation time
  await query.sequelize.query(`
    WITH calculated_interaction_times AS (
      SELECT 
        pf.id,
        MAX(
          CASE 
            WHEN (e.created_at IS NULL OR l.id IS NULL) AND ppr.created_at IS NULL THEN 
              pf.created_at
            WHEN (e.created_at IS NULL OR l.id IS NULL) AND ppr.created_at IS NOT NULL THEN 
              CASE 
                WHEN pf.created_at > ppr.created_at THEN pf.created_at
                ELSE ppr.created_at
              END
            WHEN e.created_at IS NOT NULL AND l.id IS NOT NULL AND ppr.created_at IS NULL THEN
              CASE 
                WHEN pf.created_at > e.created_at THEN pf.created_at
                ELSE e.created_at
              END
            ELSE 
              CASE 
                WHEN pf.created_at > e.created_at AND pf.created_at > ppr.created_at THEN pf.created_at
                WHEN e.created_at > pf.created_at AND e.created_at > ppr.created_at THEN e.created_at
                ELSE ppr.created_at
              END
          END
        ) as calculated_last_interacted_time
      FROM patient_facilities pf
      LEFT JOIN encounters e 
        ON pf.patient_id = e.patient_id
      LEFT JOIN locations l 
        ON e.location_id = l.id 
        AND l.facility_id = pf.facility_id
      LEFT JOIN patient_program_registrations ppr
        ON pf.patient_id = ppr.patient_id
        AND pf.facility_id = ppr.registering_facility_id
      WHERE l.id IS NOT NULL OR ppr.id IS NOT NULL
      GROUP BY pf.id, pf.created_at
    )
    UPDATE patient_facilities 
    SET last_interacted_time = COALESCE((
      SELECT calculated_last_interacted_time 
      FROM calculated_interaction_times 
      WHERE calculated_interaction_times.id = patient_facilities.id
    ), created_at)
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex('patient_facilities', ['facility_id', 'created_at_sync_tick']);
  await query.removeIndex('patient_facilities', ['facility_id', 'last_interacted_time']);

  await query.removeColumn('patient_facilities', 'last_interacted_time');
  await query.removeColumn('patient_facilities', 'created_at_sync_tick');
}
