import { SETTINGS_SCOPES } from '@tamanu/constants';
import { globalSettings } from './global';
import { centralSettings } from './central';
import { facilitySettings } from './facility';
import * as yup from 'yup';
import _ from 'lodash';
import { SettingsSchema } from './types';
import { isSetting } from './utils';

const SCOPE_TO_SCHEMA = {
  [SETTINGS_SCOPES.GLOBAL]: globalSettings,
  [SETTINGS_SCOPES.CENTRAL]: centralSettings,
  [SETTINGS_SCOPES.FACILITY]: facilitySettings,
};

const flattenSettings = (obj: unknown, parentKey = '') => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (_.isObject(value) && !Array.isArray(value)) {
      Object.assign(acc, flattenSettings(value, fullKey));
    } else {
      acc[fullKey] = value;
    }

    return acc;
  }, {} as Record<string, unknown>);
};

const flattenSchema = (schema: SettingsSchema, parentKey = '') => {
  return Object.entries(schema.properties).reduce((acc, [key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (isSetting(value)) {
      acc[fullKey] = value.type;
    } else {
      Object.assign(acc, flattenSchema(value, fullKey));
    }

    return acc;
  }, {} as Record<string, yup.AnySchema>);
};

export const validateSettings = async ({
  settings,
  scope,
  schema,
}: {
  settings: Record<string, unknown>;
  scope?: string;
  schema?: SettingsSchema;
}) => {
  const schemaValue = scope ? SCOPE_TO_SCHEMA[scope] : schema;

  if (!schemaValue) {
    throw new Error(`No schema found for scope: ${scope}`);
  }

  const flattenedSettings = flattenSettings(settings);
  const flattenedSchema = flattenSchema(schemaValue);
  const yupSchema = yup
    .object()
    .shape(flattenedSchema)
    .noUnknown();

  await yupSchema.validate(flattenedSettings, { abortEarly: false, strict: true });
};
