import { FACT_DEVICE_KEY } from '@tamanu/constants';
import type { Steps, StepArgs } from 'step';

export const STEPS: Steps = [
  {
    description: 'Initialise device key',
    afterAll: true,
    async check({ models: { LocalSystemFact } }: StepArgs) {
      return !(await LocalSystemFact.get(FACT_DEVICE_KEY));
    },
    async run({ models: { LocalSystemFact } }: StepArgs) {
      await LocalSystemFact.getDeviceKey();
    },
  },
];
