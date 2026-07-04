import { FACT_SERVER_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';
import { configOverridesForScope } from '@tamanu/settings';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';

// On the first facility upgrade, snapshot each server-scoped (machine-level)
// config value into a local Setting row. Unlike the facility step there is no
// carrier: server-scope rows live only in this server's own DB and never sync.
// Fact-gated to run once; the config fallback reader serves these values until
// then, so timing isn't load-bearing.
export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      return serverType === 'facility' && !(await LocalSystemFact.get(FACT_SERVER_CONFIG_MIGRATED));
    },
    async run({ toVersion, models: { Setting, LocalSystemFact } }: StepArgs) {
      const overrides = configOverridesForScope(SETTINGS_SCOPES.SERVER);
      for (const [key, value] of Object.entries(overrides)) {
        await Setting.set(key, value, SETTINGS_SCOPES.SERVER);
      }
      await LocalSystemFact.set(FACT_SERVER_CONFIG_MIGRATED, toVersion);
    },
  },
];
