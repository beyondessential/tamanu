import { omitBy, isUndefined, isObject, mapValues, has } from 'lodash';
import { SettingsSchema, Setting } from './types';

export const isSetting = (value: Setting | SettingsSchema): value is Setting => {
  return value && isObject(value) && has(value, 'schema') && _.has(value, 'defaultValue');
};

const isSettingsSchema = (value: Setting | SettingsSchema): value is SettingsSchema => {
  return value && isObject(value) && has(value, 'values');
};

export const extractDefaults = (settings: SettingsSchema): Record<string, any> => {
  const result = mapValues(settings.properties, value => {
    if (isSetting(value)) {
      return value.defaultValue;
    }

    // If it's a SettingsSchema, process recursively
    if (isSettingsSchema(value)) {
      return extractDefaults(value as SettingsSchema);
    }

    return undefined;
  });

  return omitBy(result, isUndefined);
};
