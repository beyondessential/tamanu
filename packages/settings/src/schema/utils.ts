import _ from 'lodash';
import { SettingsSchema, Setting } from './types';

export const isSetting = (value: Setting | SettingsSchema): value is Setting => {
  return value && _.isObject(value) && _.has(value, 'type') && _.has(value, 'defaultValue');
};

const isSettingsSchema = (value: Setting | SettingsSchema): value is SettingsSchema => {
  return value && _.isObject(value) && _.has(value, 'properties');
};

export const extractDefaults = (settings: SettingsSchema): Record<string, any> => {
  const result = _.mapValues(settings.properties, value => {
    if (isSetting(value)) {
      return value.defaultValue;
    }

    // If it's a SettingsSchema, process recursively
    if (isSettingsSchema(value)) {
      return extractDefaults(value as SettingsSchema);
    }

    return undefined;
  });

  return _.omitBy(result, _.isUndefined);
};
