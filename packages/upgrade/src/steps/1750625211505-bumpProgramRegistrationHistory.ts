import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';
import type { Steps, StepArgs } from '../step.ts';
import { END, needsMigration } from '../step.js';

export const STEPS: Steps = [
  {
    at: END,
    after: [needsMigration('1744234388450-movePatientProgramRegistrationsToAuditTable.ts')],
    async check({ serverType }: StepArgs) {
      // Only run in central server
      return serverType === 'central';
    },
    async run({ sequelize }: StepArgs) {
      // Manually inserted logs.changes records might have updated_at_sync_tick = 0,
      // so we need to bump them to the current sync tick to avoid them being skipped.
      // This only happens upgrading from a version before 2.32.0 into 2.33.0 or above.
      await sequelize.query(`
        UPDATE logs.changes
        SET updated_at_sync_tick = (
          SELECT CAST(value AS bigint) FROM local_system_facts WHERE key = :currentSyncTick
        )
        WHERE updated_at_sync_tick = 0 AND table_name = 'patient_program_registrations';
      `,
        {
          replacements: {
            currentSyncTick: FACT_CURRENT_SYNC_TICK,
          },
        },
      );
    },
  },
];
