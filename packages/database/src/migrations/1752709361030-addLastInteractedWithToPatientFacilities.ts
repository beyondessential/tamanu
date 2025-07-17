import config from 'config';
import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_facilities', 'last_interacted_time', {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  });

  const isFacility = config.serverFacilityId || config.serverFacilityIds;
  if (isFacility) return;
  
  await query.addIndex('patient_facilities', ['facility_id', 'last_interacted_time']);
  await query.sequelize.query(`
    UPDATE patient_facilities pf
    SET last_interacted_time = (
      SELECT COALESCE(
          GREATEST(
              MAX(e.created_at),
              MAX(pr.created_at)
          ),
          pf.created_at
      )
      FROM patients p
      LEFT JOIN patient_program_registrations pr ON p.id = pr.patient_id 
          AND pr.registering_facility_id = pf.facility_id
      LEFT JOIN encounters e ON p.id = e.patient_id
      LEFT JOIN locations l ON e.location_id = l.id 
          AND l.facility_id = pf.facility_id
      WHERE p.id = pf.patient_id
    );
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_facilities', 'last_interacted_time');
}
