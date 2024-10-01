import { isObject, isUndefined, mapValues, omitBy } from 'lodash';
import { Setting, SettingsSchema } from '../types';

/** Pattern from ms package. Use ms to parse these strings. */
export const DURATION_PATTERN = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

export const isSetting = (value: Setting | SettingsSchema): value is Setting => {
  return value && isObject(value) && 'type' in value && 'defaultValue' in value;
};

export const isSettingsSchema = (value: Setting | SettingsSchema): value is SettingsSchema => {
  return value && isObject(value) && 'properties' in value;
};

export const extractDefaults = (settings: SettingsSchema) => {
  const result = mapValues(settings.properties, value =>
    isSetting(value) ? value.defaultValue : extractDefaults(value),
  );

  return omitBy(result, isUndefined);
};
