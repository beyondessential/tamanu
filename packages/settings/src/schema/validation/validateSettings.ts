import { SETTINGS_SCOPES } from '@tamanu/constants';
import { globalSettings } from '../global';
import { centralSettings } from '../central';
import { facilitySettings } from '../facility';
import * as yup from 'yup';
import _ from 'lodash';
import { SettingsSchema } from '../types';
import { isSetting } from '../utils';

interface ErrorMessage {
  field: string;
  message: string;
}

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
      acc[fullKey] = { schema: value.schema };
    } else {
      Object.assign(acc, flattenSchema(value as SettingsSchema, fullKey));
    }

    return acc;
  }, {} as Record<string, any>);
};

const constructErrorMessage = (errors: ErrorMessage[]) => {
  return `Validation failed for the following fields: ${errors.map(
    e => `${e.field}: ${e.message}`,
  )}`;
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
  const flattenedSchema = flattenSchema(schema);

  const errors: ErrorMessage[] = [];

  for (const [key, value] of Object.entries(flattenedSettings)) {
    const schemaEntry = flattenedSchema[key]?.schema;

    if (!schemaEntry) {
      console.warn(`Unknown setting: ${key}`);
      continue;
    }

    try {
      await schemaEntry.validate(value);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        errors.push({ field: key, message: error.message });
        continue;
      } else {
        throw error;
      }
    }
  }

  if (errors.length) {
    throw new Error(constructErrorMessage(errors));
  }
};
