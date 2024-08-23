import _ from 'lodash';
import { SettingsSchema, Setting } from './types';

export const isSetting = (value: Setting | SettingsSchema): value is Setting => {
  return value && typeof value === 'object' && 'schema' in value && 'defaultValue' in value;
};

export const extractDefaults = (settings: SettingsSchema): Record<string, any> => {
  const result = _.mapValues(settings.values, value => {
    if (isSetting(value)) {
      return value.defaultValue;
    }

    // If it's a SettingsSchema, process recursively
    if (typeof value === 'object' && value !== null) {
      return extractDefaults(value as SettingsSchema);
    }

    return undefined;
  });

  return _.omitBy(result, _.isUndefined);
};
