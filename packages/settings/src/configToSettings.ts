import config from 'config';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { get, has, set } from 'es-toolkit/compat';

import { getScopedSchema, getSettingAtPath } from './schema';
import { ReaderSettingResult } from './reader/readers/Reader';

export interface ConfigToSetting {
  config: string; // legacy node-config path
  setting: string; // settings key path (may differ from config once a key is renamed)
  scope: string; // a SETTINGS_SCOPES value
}

// Source of truth for the config -> settings move (TAM-6864): one row per non-secret
// key that left config. The config and setting paths match today, but diverge when a
// key is renamed or reshuffled (e.g. dropping localisation nesting) — which no schema
// walk could infer, and which is also why `scope` is stated rather than derived
// (`integrations`/`patientPortal` exist in more than one scope). Drives both the
// config fallback reader and the upgrade steps; drop a row once its key no longer
// needs the config fallback. Secrets are intentionally excluded — they keep their own
// getSettingSecret config fallback.
export const CONFIG_TO_SETTINGS: ConfigToSetting[] = [
  { config: 'language', setting: 'language', scope: SETTINGS_SCOPES.CENTRAL },
  {
    config: 'patientCommunication.retryThreshold',
    setting: 'patientCommunication.retryThreshold',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  {
    config: 'patientPortal.tokenDuration',
    setting: 'patientPortal.tokenDuration',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  {
    config: 'patientPortal.loginTokenDurationMinutes',
    setting: 'patientPortal.loginTokenDurationMinutes',
    scope: SETTINGS_SCOPES.GLOBAL,
  },
  {
    config: 'patientPortal.registerTokenDurationMinutes',
    setting: 'patientPortal.registerTokenDurationMinutes',
    scope: SETTINGS_SCOPES.GLOBAL,
  },
  {
    config: 'export.maxFileSizeInMB',
    setting: 'export.maxFileSizeInMB',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  { config: 'mail.from', setting: 'mail.from', scope: SETTINGS_SCOPES.CENTRAL },
  { config: 'mail.transport', setting: 'mail.transport', scope: SETTINGS_SCOPES.CENTRAL },
  {
    config: 'integrations.ips.email',
    setting: 'integrations.ips.email',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
];

// Local config values for the keys mapped to `scope`, keyed by their setting path.
// Skips secrets and any key absent from the scope's schema. Reads config via lodash
// get/has (not config.get/has) so it works with the partial config mocks some tests
// use and doesn't trip node-config's get()-triggered immutability.
export function configOverridesForScope(scope: string): ReaderSettingResult {
  const schema = getScopedSchema(scope);
  const result: ReaderSettingResult = {};
  if (!schema) return result;
  for (const entry of CONFIG_TO_SETTINGS) {
    if (entry.scope !== scope) continue;
    const setting = getSettingAtPath(schema, entry.setting);
    if (!setting || setting.secret) continue;
    if (has(config, entry.config)) set(result, entry.setting, get(config, entry.config));
  }
  return result;
}
