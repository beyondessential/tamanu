import { FACT_DEVICE_KEY } from '@tamanu/constants';
import type { Steps, StepArgs } from '../step.ts';
import { END, needsMigration } from '../step.js';

export const STEPS: Steps = [
  {
    at: END,
    // The device key now lives in local_system_secrets (kept out of
    // local_system_facts so the raw reporting role can't read it).
    after: [needsMigration('1782200000000-createLocalSystemSecretsTable.ts')],
    async check({ models: { LocalSystemSecret } }: StepArgs) {
      return !(await LocalSystemSecret.get(FACT_DEVICE_KEY));
    },
    async run({ models: { LocalSystemSecret } }: StepArgs) {
      await LocalSystemSecret.getDeviceKey();
    },
  },
];
