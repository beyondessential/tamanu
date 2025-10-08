import type { Steps, StepArgs } from '../step.ts';
import { END, needsMigration } from '../step.js';

export const STEPS: Steps = [
  {
    at: END,
    after: [needsMigration('1749085069144-addProgramRegistryConditionCategoriesTable.ts')],
    async check({ serverType }: StepArgs) {
      // Only run in central server
      return serverType === 'central';
    },
    async run({ sequelize }: StepArgs) {
      // Update program registry condition category records
      await sequelize.query(`
        UPDATE program_registry_condition_categories
        SET updated_at_sync_tick = (
          SELECT CAST(value AS bigint) FROM local_system_facts WHERE key = 'currentSyncTick'
        );
      `);

      // Update patient program registration condition category records
      await sequelize.query(`
        UPDATE patient_program_registration_conditions
        SET updated_at_sync_tick = (
          SELECT CAST(value AS bigint) FROM local_system_facts WHERE key = 'currentSyncTick'
        );
      `);
    },
  },
];
