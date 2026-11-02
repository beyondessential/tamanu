import { FACT_CENTRAL_LATE_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';
import { configOverridesForScope } from '@tamanu/settings';
import { get as getAtPath } from 'es-toolkit/compat';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';

// Keys added to CONFIG_TO_SETTINGS after servers had already run the one-off central
// migration, which is fact-gated and won't pick them up.
export const LATE_CENTRAL_KEYS = ['sync.numberConcurrentPullSnapshots'];

export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      return (
        serverType === 'central' && !(await LocalSystemFact.get(FACT_CENTRAL_LATE_CONFIG_MIGRATED))
      );
    },
    async run({ toVersion, models: { Setting, LocalSystemFact } }: StepArgs) {
      const overrides = configOverridesForScope(SETTINGS_SCOPES.CENTRAL);
      for (const key of LATE_CENTRAL_KEYS) {
        const value = getAtPath(overrides, key);
        if (value === undefined) continue;
        if ((await Setting.get(key, null, SETTINGS_SCOPES.CENTRAL)) !== undefined) continue;
        await Setting.set(key, value, SETTINGS_SCOPES.CENTRAL);
      }
      await LocalSystemFact.set(FACT_CENTRAL_LATE_CONFIG_MIGRATED, toVersion);
    },
  },
];
