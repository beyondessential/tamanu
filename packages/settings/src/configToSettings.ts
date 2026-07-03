import config from 'config';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { cloneDeep, get, has, isEqual, set } from 'es-toolkit/compat';

import { getScopedSchema } from './schema';
import { isSetting } from './schema/utils';
import type { Setting, SettingsSchema } from './types';
import { ReaderSettingResult } from './reader/readers/Reader';

export interface ConfigToSetting {
  // Legacy node-config path; use the array form when a config key itself
  // contains a dot (e.g. ['socket.io', 'enabled'])
  config: string | string[];
  setting: string; // settings key path (may differ from config once a key is renamed)
  scope: string; // a SETTINGS_SCOPES value
}

// Source of truth for the config -> settings move (TAM-6864): one row per non-secret
// key that left config. The config and setting paths diverge when a key is renamed or
// reshuffled (e.g. mailgun.from -> mail.from, dropping localisation nesting) — which
// no schema walk could infer, and which is also why `scope` is stated rather than
// derived (`integrations`/`patientPortal` exist in more than one scope). Drives both
// the config fallback reader and the upgrade steps; drop a row once its key no longer
// needs the config fallback. Secrets are intentionally excluded — they keep their own
// getSettingSecret config fallback. When two rows target the same setting, the later
// row wins where both config values are present, so list the legacy spelling first.
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
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  {
    config: 'patientPortal.registerTokenDurationMinutes',
    setting: 'patientPortal.registerTokenDurationMinutes',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  {
    config: 'export.maxFileSizeInMB',
    setting: 'export.maxFileSizeInMB',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  { config: 'mailgun.from', setting: 'mail.from', scope: SETTINGS_SCOPES.CENTRAL },
  { config: 'mailgun.domain', setting: 'mail.mailgun.domain', scope: SETTINGS_SCOPES.CENTRAL },
  { config: 'mailgun.url', setting: 'mail.mailgun.url', scope: SETTINGS_SCOPES.CENTRAL },
  { config: 'mail.from', setting: 'mail.from', scope: SETTINGS_SCOPES.CENTRAL },
  { config: 'mail.transport', setting: 'mail.transport', scope: SETTINGS_SCOPES.CENTRAL },
  {
    config: 'integrations.ips',
    setting: 'integrations.ips',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  {
    config: 'integrations.dhis2.username',
    setting: 'integrations.dhis2.username',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  { config: 'telegramBot', setting: 'integrations.telegram', scope: SETTINGS_SCOPES.CENTRAL },
  {
    config: 'scheduledReports',
    setting: 'reporting.scheduledReports',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  {
    config: 'validateQuestionConfigs.enabled',
    setting: 'validateQuestionConfigs.enabled',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  {
    config: 'notifications.referralCreated',
    setting: 'notifications.referralCreated',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  // Facility-server schedules; distinct from the central row above because the two
  // servers' schema (and scope) differ while sharing the `schedules` config path.
  { config: 'schedules', setting: 'schedules', scope: SETTINGS_SCOPES.FACILITY },
  {
    config: 'notifications.certificates.labTestCategoryIds',
    setting: 'notifications.certificates.labTestCategoryIds',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  {
    config: 'medicationAdministrationRecord.upcomingRecordsShouldBeGeneratedTimeFrame',
    setting: 'medicationAdministrationRecord.upcomingRecordsShouldBeGeneratedTimeFrame',
    scope: SETTINGS_SCOPES.GLOBAL,
  },
  {
    config: 'tasking.upcomingTasksShouldBeGeneratedTimeFrame',
    setting: 'tasking.upcomingTasksShouldBeGeneratedTimeFrame',
    scope: SETTINGS_SCOPES.GLOBAL,
  },
  {
    config: 'tasking.upcomingTasksTimeFrame',
    setting: 'tasking.upcomingTasksTimeFrame',
    scope: SETTINGS_SCOPES.FACILITY,
  },
  {
    config: 'integrations.mSupplyMed',
    setting: 'integrations.mSupplyMed',
    scope: SETTINGS_SCOPES.FACILITY,
  },
  // Subtree row: lifts every scheduled-task knob under `schedules` in one go.
  { config: 'schedules', setting: 'schedules', scope: SETTINGS_SCOPES.CENTRAL },
  // Legacy `localisation` un-nested into top-level settings (central config only;
  // facility servers never carried these keys).
  { config: 'localisation.data.units', setting: 'units', scope: SETTINGS_SCOPES.GLOBAL },
  { config: 'localisation.data.country', setting: 'country', scope: SETTINGS_SCOPES.GLOBAL },
  {
    config: 'localisation.data.imagingTypes',
    setting: 'imagingTypes',
    scope: SETTINGS_SCOPES.GLOBAL,
  },
  {
    config: 'localisation.data.disabledReports',
    setting: 'reporting.disabledReports',
    scope: SETTINGS_SCOPES.GLOBAL,
  },
  {
    config: 'localisation.data.supportDeskUrl',
    setting: 'supportDeskUrl',
    scope: SETTINGS_SCOPES.GLOBAL,
  },
  {
    config: 'localisation.labResultWidget',
    setting: 'labResultWidget',
    scope: SETTINGS_SCOPES.CENTRAL,
  },
  { config: 'cors', setting: 'security.cors', scope: SETTINGS_SCOPES.CENTRAL },
  { config: ['socket.io'], setting: 'websocket', scope: SETTINGS_SCOPES.CENTRAL },
  { config: 's3', setting: 's3', scope: SETTINGS_SCOPES.CENTRAL },
  { config: 'loadshedder', setting: 'loadshedder', scope: SETTINGS_SCOPES.CENTRAL },
  { config: 'rateLimit', setting: 'rateLimit', scope: SETTINGS_SCOPES.GLOBAL },
  // Subtree row: lifts the auth behaviour knobs; the token secrets are absent from
  // the schema (env vars), so the walk never lifts them.
  { config: 'auth', setting: 'auth', scope: SETTINGS_SCOPES.GLOBAL },
  // Facility-local config overrides of these two migrate as facility-scope
  // settings (facility overrides global); reads resolve via serverScopedSettings.
  {
    config: 'auth.tokenDuration',
    setting: 'auth.tokenDuration',
    scope: SETTINGS_SCOPES.FACILITY,
  },
  { config: 'rateLimit', setting: 'rateLimit', scope: SETTINGS_SCOPES.FACILITY },
  { config: 'updateUrls', setting: 'metaServer.updateUrls', scope: SETTINGS_SCOPES.GLOBAL },
  { config: 'metaServer', setting: 'metaServer', scope: SETTINGS_SCOPES.GLOBAL },
];

const schemaNodeAtPath = (
  schema: SettingsSchema,
  path: string,
): Setting | SettingsSchema | null => {
  let current: Setting | SettingsSchema = schema;
  for (const part of path.split('.')) {
    if (isSetting(current)) return null;
    const next: Setting | SettingsSchema | undefined = current.properties[part];
    if (!next) return null;
    current = next;
  }
  return current;
};

// Config paths are handled as segment arrays so a config key containing a dot
// (e.g. the legacy `socket.io` block) can be addressed as ['socket.io', ...].
const liftConfigValue = (
  node: Setting | SettingsSchema,
  configPath: string[],
  settingPath: string,
  result: ReaderSettingResult,
) => {
  if (isSetting(node)) {
    if (node.secret) return;
    if (has(config, configPath)) {
      const value = get(config, configPath);
      // A value equal to the schema default carries no information (the defaults
      // layer already provides it) and would shadow a renamed legacy lift for the
      // same setting (e.g. default-empty mail.from over a set mailgun.from).
      // Cloned: node-config objects are immutable, and serving a reference lets
      // the settings cascade's merge mutate them, crashing the read.
      if (!isEqual(value, node.defaultValue)) set(result, settingPath, cloneDeep(value));
    }
    return;
  }
  for (const [key, child] of Object.entries(node.properties)) {
    liftConfigValue(child, [...configPath, key], `${settingPath}.${key}`, result);
  }
};

// Local config values for the keys mapped to `scope`, keyed by their setting path.
// A row may point at a single setting or a whole subtree (e.g. `schedules`) — for a
// subtree, every non-secret leaf under it is lifted, with the keys below the row's
// paths assumed unchanged. Skips secrets and any key absent from the scope's schema.
// Reads config via lodash get/has (not config.get/has) so it works with the partial
// config mocks some tests use and doesn't trip node-config's get()-triggered
// immutability.
export function configOverridesForScope(scope: string): ReaderSettingResult {
  const schema = getScopedSchema(scope);
  const result: ReaderSettingResult = {};
  if (!schema) return result;
  for (const entry of CONFIG_TO_SETTINGS) {
    if (entry.scope !== scope) continue;
    const node = schemaNodeAtPath(schema, entry.setting);
    if (!node) continue;
    const configPath = Array.isArray(entry.config) ? entry.config : entry.config.split('.');
    liftConfigValue(node, configPath, entry.setting, result);
  }
  return result;
}
