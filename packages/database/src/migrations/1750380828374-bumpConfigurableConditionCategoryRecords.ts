import config from 'config';
import { QueryInterface } from 'sequelize';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

export async function up(query: QueryInterface): Promise<void> {
  // Only run in central server
  const isFacility = Boolean(selectFacilityIds(config));

  if (isFacility) {
    return;
  }

  // Update program registry condition category records
  await query.sequelize.query(`
    UPDATE program_registry_condition_categories
    SET updated_at_sync_tick = (
      SELECT CAST(value AS bigint) FROM local_system_facts WHERE key = 'currentSyncTick'
    );
  `);

  // Update patient program registration condition category records
  await query.sequelize.query(`
    UPDATE patient_program_registration_conditions
    SET updated_at_sync_tick = (
      SELECT CAST(value AS bigint) FROM local_system_facts WHERE key = 'currentSyncTick'
    );
  `);
}

export async function down(): Promise<void> {
  // Not possible to downgrade
}
