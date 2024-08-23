import { omitBy, isUndefined, mapValues } from 'lodash';
import { SettingsSchema, Setting } from './types';

export const isSetting = (value: Setting | SettingsSchema): value is Setting => {
  return value && typeof value === 'object' && 'schema' in value && 'defaultValue' in value;
};

export const extractDefaults = (settings: SettingsSchema): Record<string, any> => {
  const result = mapValues(settings.properties, value => {
    if (isSetting(value)) {
      return value.defaultValue;
    }

    // If it's a SettingsSchema, process recursively
    if (typeof value === 'object' && value !== null) {
      return extractDefaults(value as SettingsSchema);
    }

    return undefined;
  });

  return omitBy(result, isUndefined);
};
