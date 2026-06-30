import config from 'config';
import { get, has, isEmpty } from 'es-toolkit/compat';

import { isSetting } from '../../schema/utils';
import { SettingsSchema } from '../../types';
import { Reader, ReaderSettingResult } from './Reader';

// Pull the value the local config defines at each setting's path, scoped to the
// schema (so non-setting config like db credentials is never surfaced). Lets a
// deployment's existing config override a key that has no setting recorded yet,
// keeping behaviour unchanged while config moves into settings.
//
// We navigate config as a plain object (lodash get/has) rather than via
// config.get()/has(): it reads the same values, but works with the partial
// config mocks some tests use (which lack the node-config methods) and doesn't
// trip node-config's get()-triggered immutability.
function configOverridesForSchema(schema: SettingsSchema, parentKey = ''): ReaderSettingResult {
  const result: ReaderSettingResult = {};
  for (const [key, value] of Object.entries(schema.properties)) {
    const path = parentKey ? `${parentKey}.${key}` : key;
    if (isSetting(value)) {
      // Skip secrets: they're read via getSettingSecret (which expects an
      // encrypted value and has its own config fallback), so surfacing the
      // plaintext config value here would feed it an unencrypted value.
      if (value.secret) continue;
      if (has(config, path)) result[key] = get(config, path);
    } else {
      const nested = configOverridesForSchema(value, path);
      if (!isEmpty(nested)) result[key] = nested;
    }
  }
  return result;
}

export class SettingsConfigReader extends Reader {
  schema: SettingsSchema;
  constructor(schema: SettingsSchema) {
    super();
    this.schema = schema;
  }

  async getSettings() {
    return configOverridesForSchema(this.schema);
  }
}
