import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM sync_lookup
    WHERE record_type = 'encounter_medications';
  `);

  // Set the updated_at_sync_tick to the greatest of the encounter, encounter_prescription, and prescription updated_at_sync_tick
  // They had been initially set to 0, so just ensuring that they don't get missed
  await query.sequelize.query(`
    UPDATE encounter_prescriptions
    SET updated_at_sync_tick = GREATEST(ep.updated_at_sync_tick, e.updated_at_sync_tick, p.updated_at_sync_tick)
    FROM encounter_prescriptions ep 
    JOIN prescriptions p ON p.id = ep.prescription_id
    JOIN encounters e ON e.id = ep.encounter_id
    WHERE encounter_prescriptions.id = ep.id
  `);

  await query.sequelize.query(`
    SELECT flag_lookup_model_to_rebuild('prescriptions');
    SELECT flag_lookup_model_to_rebuild('encounter_prescriptions');
  `);
}

export async function down(): Promise<void> {
  // No reverse migration
}
