import config from 'config';
import { DataTypes, QueryInterface, Sequelize } from 'sequelize';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_facilities', 'last_interacted_time', {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn('now')
  });

  await query.addColumn('patient_facilities', 'created_at_sync_tick', {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: Sequelize.fn('local_system_fact', FACT_CURRENT_SYNC_TICK, 0),
  });

  await query.sequelize.query(`
    UPDATE patient_facilities
    SET created_at_sync_tick = updated_at_sync_tick;
  `);

  const isFacility = config.serverFacilityId || config.serverFacilityIds;
  if (isFacility) return;

  await query.addIndex('patient_facilities', ['facility_id', 'last_interacted_time']);
  
  await query.sequelize.query(`
    WITH calculated_interaction_times AS (
      SELECT 
        pf.id,
        COALESCE(
          GREATEST(
            MAX(e.created_at),
            MAX(pr.created_at),
            pf.created_at
          )
        ) as calculated_last_interacted_time
      FROM patient_facilities pf
      LEFT JOIN patients p ON p.id = pf.patient_id
      LEFT JOIN patient_program_registrations pr ON p.id = pr.patient_id 
        AND pr.registering_facility_id = pf.facility_id
      LEFT JOIN encounters e ON p.id = e.patient_id
      LEFT JOIN locations l ON e.location_id = l.id 
        AND l.facility_id = pf.facility_id
      GROUP BY pf.id, pf.created_at
    )
    UPDATE patient_facilities pf
    SET last_interacted_time = cit.calculated_last_interacted_time
    FROM calculated_interaction_times cit
    WHERE pf.id = cit.id;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_facilities', 'last_interacted_time');
}
