import { isObject, isUndefined, mapValues, omitBy } from 'lodash';
import type { Setting, SettingsSchema } from '../types';
import type { ReaderSettingResult } from 'reader/readers/Reader';

export const isSetting = (value: Setting | SettingsSchema): value is Setting => {
  return value && isObject(value) && 'type' in value && 'defaultValue' in value;
};

export const isSettingsSchema = (value: Setting | SettingsSchema): value is SettingsSchema => {
  return value && isObject(value) && 'properties' in value;
};

export const extractDefaults = (settings: SettingsSchema): ReaderSettingResult => {
  const result = mapValues(settings.properties, (value) =>
    isSetting(value) ? value.defaultValue : extractDefaults(value),
  ) as SettingsSchema;

  return omitBy(result, isUndefined) as ReaderSettingResult;
};
