import config from 'config';
import { FACT_CENTRAL_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';
import { CONFIG_TO_SECRET_SETTINGS, configOverridesForScope } from '@tamanu/settings';
import {
  encryptSecret,
  getConfigSecret,
  getSettingsPskKeyBuffer,
  SecretNotConfiguredError,
} from '@tamanu/shared/utils/crypto';
import { cloneDeep, defaultsDeep, get as getAtPath, isEmpty } from 'es-toolkit/compat';

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
export const splitTransportPassword = async (overrides: any, log?: StepArgs['log']) => {
  const pass = overrides?.mail?.transport?.auth?.pass;
  if (!pass) return overrides;
  let encrypted;
  try {
    encrypted = await encryptSecret(await getSettingsPskKeyBuffer(), String(pass));
  } catch (error) {
    // No settings encryption key provisioned: leave the password embedded in the
    // transport (matching legacy config behaviour) rather than failing the upgrade.
    log?.warn(
      'crypto.settingsPsk is not configured, so the SMTP password stays embedded in ' +
        'mail.transport instead of the mail.transportPassword secret; configure the key ' +
        'and re-save the password via the admin UI',
      { error },
    );
    return overrides;
  }
  delete overrides.mail.transport.auth.pass;
  if (isEmpty(overrides.mail.transport.auth)) delete overrides.mail.transport.auth;
  // eslint-disable-next-line require-atomic-updates
  overrides.mail.transportPassword = encrypted;
  return overrides;
};

// Copy credential secrets out of config into encrypted settings. Each source is
// read in its config form — an encrypted config secret (decrypted with the config
// key file) or plaintext — then re-encrypted into the setting via setSecret. An
// existing setting always wins. Anything unconfigured, or a missing config key
// file / settings PSK, is skipped with a warning rather than failing the upgrade;
// those secrets keep their runtime config fallback until set in the admin UI.
// Exported for tests.
export const migrateSecrets = async (
  Setting: StepArgs['models']['Setting'],
  scope: string,
  log?: StepArgs['log'],
) => {
  for (const entry of CONFIG_TO_SECRET_SETTINGS.filter(secret => secret.scope === scope)) {
    let plaintext;
    try {
      if (entry.encryptedInConfig) {
        plaintext = await getConfigSecret(entry.config);
      } else {
        const raw = getAtPath(config, entry.config);
        plaintext = typeof raw === 'string' && raw.trim() ? raw : undefined;
      }
    } catch (error) {
      // Not configured (or no config key file) — nothing to migrate for this one.
      if (error instanceof SecretNotConfiguredError) continue;
      log?.warn('migrateSecrets: could not read the config secret; skipping', {
        setting: entry.setting,
        error: (error as Error).message,
      });
      continue;
    }
    if (!plaintext) continue;
    // Never overwrite an operator's (or a prior run's) recorded secret.
    if (await Setting.get(entry.setting, null, scope)) continue;
    try {
      await Setting.setSecret(entry.setting, plaintext, scope);
    } catch (error) {
      log?.warn(
        'migrateSecrets: settings PSK not configured, so the secret stays in config until ' +
          'set via the admin UI',
        { setting: entry.setting, error: (error as Error).message },
      );
    }
  }
};

// On the first central upgrade, seed central- and global-scoped settings from the
// legacy config (per the CONFIG_TO_SETTINGS map) so values moved out of config keep
// their deployment overrides. Runs once (guarded by a fact) so it can't resurrect a
// setting an operator later deletes while the config value is still present.
export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      return serverType === 'central' && !(await LocalSystemFact.get(FACT_CENTRAL_CONFIG_MIGRATED));
    },
    async run({ toVersion, log, models: { Setting, LocalSystemFact } }: StepArgs) {
      for (const scope of [SETTINGS_SCOPES.CENTRAL, SETTINGS_SCOPES.GLOBAL]) {
        const overrides = await splitTransportPassword(configOverridesForScope(scope), log);
        if (!isEmpty(overrides)) {
          const existing = (await Setting.get('', null, scope)) ?? {};
          await Setting.set('', mergeConfigUnderExisting(existing, overrides), scope);
        }
        // Runs regardless of non-secret overrides: a scope may have only secrets.
        await migrateSecrets(Setting, scope, log);
      }
      await LocalSystemFact.set(FACT_CENTRAL_CONFIG_MIGRATED, toVersion);
    },
  },
];
