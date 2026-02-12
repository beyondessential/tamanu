import { QueryInterface } from 'sequelize';

/**
 * Migrates existing Medication dispensing encounters from clinic type to the new
 * medicationDispensing encounter type.
 *
 * Previously these were created as clinic encounters with reason_for_encounter =
 * 'Medication dispensing'. Now they use encounter_type = 'medicationDispensing'.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE encounters
    SET encounter_type = 'medicationDispensing'
    WHERE encounter_type = 'clinic'
      AND reason_for_encounter = 'Medication dispensing'
      AND deleted_at IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE encounters
    SET encounter_type = 'clinic',
        reason_for_encounter = 'Medication dispensing'
    WHERE encounter_type = 'medicationDispensing'
      AND deleted_at IS NULL
  `);
}
