import { QueryInterface } from 'sequelize';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import config from 'config';

export async function up(query: QueryInterface): Promise<void> {
  const isFacility = Boolean(selectFacilityIds(config));

  if (isFacility) {
    return;
  }
  // Update updated_at_sync_tick for patient_program_registrations
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET updated_at_sync_tick = (SELECT CAST(value AS bigint) FROM local_system_facts WHERE key = 'currentSyncTick')
  `);

  // Update updated_at_sync_tick for patient_program_registration_conditions
  await query.sequelize.query(`
    UPDATE patient_program_registration_conditions
    SET updated_at_sync_tick = (SELECT CAST(value AS bigint) FROM local_system_facts WHERE key = 'currentSyncTick')
  `);

  // Delete records from sync_lookup table
  await query.sequelize.query(`
    DELETE FROM sync_lookup
    WHERE record_type IN ('patient_program_registrations', 'patient_program_registration_conditions')
  `);
}

export async function down(): Promise<void> {
  // Note: This migration cannot be easily reversed as we're updating existing data
  // and deleting records.
}
