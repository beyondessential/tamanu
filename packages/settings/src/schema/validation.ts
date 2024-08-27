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

const flattenSettings = (obj: Record<string, any>, parentKey: string = ''): Record<string, any> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (_.isObject(value) && !Array.isArray(value)) {
      Object.assign(acc, flattenSettings(value, fullKey));
    } else {
      acc[fullKey] = value;
    }

    return acc;
  }, {} as Record<string, any>);
};

const flattenSchema = (schema: SettingsSchema, parentKey: string = ''): Record<string, any> => {
  return Object.entries(schema.properties).reduce((acc, [key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (isSetting(value)) {
      acc[fullKey] = value.schema;
    } else {
      Object.assign(acc, flattenSchema(value as SettingsSchema, fullKey));
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
  schema = scope ? SCOPE_TO_SCHEMA[scope] : schema;

  if (!schema) {
    throw new Error(`No schema found for scope: ${scope}`);
  }

  const flattenedSettings = flattenSettings(settings);
  const flattenedSchema = flattenSchema(schema);
  const yupSchema = yup
    .object()
    .shape(flattenedSchema)
    .noUnknown();

  await yupSchema.validate(flattenedSettings, { abortEarly: false, strict: true });
};
