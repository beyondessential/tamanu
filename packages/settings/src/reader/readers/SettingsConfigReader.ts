import config from 'config';
import { isEmpty } from 'es-toolkit/compat';

import { isSetting } from '../../schema/utils';
import { SettingsSchema } from '../../types';
import { Reader, ReaderSettingResult } from './Reader';

// Pull the value the local config defines at each setting's path, scoped to the
// schema (so non-setting config like db credentials is never surfaced). Lets a
// deployment's existing config override a key that has no setting recorded yet,
// keeping behaviour unchanged while config moves into settings.
function configOverridesForSchema(schema: SettingsSchema, parentKey = ''): ReaderSettingResult {
  const result: ReaderSettingResult = {};
  for (const [key, value] of Object.entries(schema.properties)) {
    const path = parentKey ? `${parentKey}.${key}` : key;
    if (isSetting(value)) {
      if (config.has(path)) result[key] = config.get(path);
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
