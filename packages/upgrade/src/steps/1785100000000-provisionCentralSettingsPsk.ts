import { ensureSettingsPsk } from '@tamanu/shared/utils/crypto';

import { END, needsMigration, type Steps, type StepArgs } from '../step.js';

export const STEPS: Steps = [
  {
    at: END,
    // Needs the local_system_secrets table (at: END alone doesn't order after
    // migrations — the dependency does).
    after: [needsMigration('1782200000000-createLocalSystemSecretsTable.ts')],
    // Central owns the deployment-wide settings PSK: generate it once, or adopt a
    // legacy crypto.settingsPsk config value, into the local secrets store. It must
    // exist before any facility pulls it and before an admin saves a settings
    // secret. Facilities never generate their own — they pull this from central.
    //
    // check() gates on server type only. The PSK-presence test lives in
    // ensureSettingsPsk (run-time): local_system_secrets is created by a migration
    // in this same upgrade, so it may not exist when check() is evaluated during
    // planning. ensureSettingsPsk is idempotent, so re-running each upgrade is fine.
    async check({ serverType }: StepArgs) {
      return serverType === 'central';
    },
    async run({ models: { LocalSystemSecret } }: StepArgs) {
      await ensureSettingsPsk(LocalSystemSecret);
    },
  },
];
