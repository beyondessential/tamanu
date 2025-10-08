import { FACT_DEVICE_KEY } from '@tamanu/constants';
import type { Steps, StepArgs } from '../step.ts';
import { END, needsMigration } from '../step.js';

export const STEPS: Steps = [
  {
    at: END,
    after: [needsMigration('1739968205100-addLSFFunction.ts')],
    async check({ models: { LocalSystemFact } }: StepArgs) {
      return !(await LocalSystemFact.get(FACT_DEVICE_KEY));
    },
    async run({ models: { LocalSystemFact } }: StepArgs) {
      await LocalSystemFact.getDeviceKey();
    },
  },
];
