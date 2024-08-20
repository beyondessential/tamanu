import { mapValues } from 'lodash';
import { SettingsSchema, Setting } from './types';

const isSetting = (value: Setting | SettingsSchema): value is Setting => {
  return value && typeof value === 'object' && 'schema' in value && 'default' in value;
};

export const extractDefaults = (settings: SettingsSchema) => {
  return mapValues(settings, value => {
    if (isSetting(value)) {
      return value.default;
    }

    return extractDefaults(value);
  });
};
