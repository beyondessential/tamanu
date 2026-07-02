import { FACT_CENTRAL_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';
import { configOverridesForScope } from '@tamanu/settings';
import { encryptSecret, getSettingsPskKeyBuffer } from '@tamanu/shared/utils/crypto';
import { cloneDeep, defaultsDeep, isEmpty } from 'es-toolkit/compat';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';

// Merge config overrides under the recorded settings so an existing setting always
// wins — an operator's value is never overwritten, config only fills the gaps.
export const mergeConfigUnderExisting = (existing: object, overrides: object) =>
  defaultsDeep(cloneDeep(existing ?? {}), overrides);

// A legacy config mail.transport may embed the SMTP password (nodemailer's
// auth.pass). Settings keep that credential in the mail.transportPassword secret
// instead, so split it out and encrypt it rather than persisting it in plain text.
// Exported for tests.
export const splitTransportPassword = async (overrides: any) => {
  const pass = overrides?.mail?.transport?.auth?.pass;
  if (!pass) return overrides;
  delete overrides.mail.transport.auth.pass;
  if (isEmpty(overrides.mail.transport.auth)) delete overrides.mail.transport.auth;
  // eslint-disable-next-line require-atomic-updates
  overrides.mail.transportPassword = await encryptSecret(
    await getSettingsPskKeyBuffer(),
    String(pass),
  );
  return overrides;
};

// On the first central upgrade, seed central- and global-scoped settings from the
// legacy config (per the CONFIG_TO_SETTINGS map) so values moved out of config keep
// their deployment overrides. Runs once (guarded by a fact) so it can't resurrect a
// setting an operator later deletes while the config value is still present.
export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      return (
        serverType === 'central' && !(await LocalSystemFact.get(FACT_CENTRAL_CONFIG_MIGRATED))
      );
    },
    async run({ toVersion, models: { Setting, LocalSystemFact } }: StepArgs) {
      for (const scope of [SETTINGS_SCOPES.CENTRAL, SETTINGS_SCOPES.GLOBAL]) {
        const overrides = await splitTransportPassword(configOverridesForScope(scope));
        if (isEmpty(overrides)) continue;
        const existing = (await Setting.get('', null, scope)) ?? {};
        await Setting.set('', mergeConfigUnderExisting(existing, overrides), scope);
      }
      await LocalSystemFact.set(FACT_CENTRAL_CONFIG_MIGRATED, toVersion);
    },
  },
];
