import _ from 'lodash';
import { SettingsSchema, Setting } from './types';

const isSetting = (value: Setting | SettingsSchema): value is Setting => {
  return value && typeof value === 'object' && 'schema' in value && 'defaultValue' in value;
};

export const extractDefaults = (settings: SettingsSchema) => {
  const result = _.mapValues(settings, value => {
    if (typeof value === 'string') {
      return undefined;
    }

    if (isSetting(value)) {
      return value.defaultValue;
    }

    return extractDefaults(value as SettingsSchema);
  });

  return _.omitBy(result, _.isUndefined);
};
