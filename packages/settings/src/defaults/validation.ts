import { SETTINGS_SCOPES } from '@tamanu/constants';
import { globalSettings } from './global';
import { centralSettings } from './central';
import { facilitySettings } from './facility';
import * as yup from 'yup';
import _ from 'lodash';

interface ErrorMessage {
  field: string;
  message: string;
}

const SCOPE_TO_SCHEMA = {
  [SETTINGS_SCOPES.GLOBAL]: globalSettings,
  [SETTINGS_SCOPES.CENTRAL]: centralSettings,
  [SETTINGS_SCOPES.FACILITY]: facilitySettings,
};

const flattenObject = (obj: any, parentKey: string = ''): any => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (Array.isArray(value)) {
      // Prevent flattening of arrays
      acc[fullKey] = value;
    } else if (_.isObject(value) && !(value as { schema?: any }).schema) {
      // Check if the object is empty
      if (Object.keys(value).length === 0) {
        acc[fullKey] = value;
      } else {
        Object.assign(acc, flattenObject(value, fullKey));
      }
    } else {
      acc[fullKey] = value;
    }

    return acc;
  }, {});
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
  settings: Record<string, any>;
  scope?: string;
  schema?: Record<string, any>;
}) => {
  schema = scope ? SCOPE_TO_SCHEMA[scope] : schema;

  if (!schema) {
    throw new Error(`No schema found for scope: ${scope}`);
  }

  const flattenedSettings = flattenObject(settings);
  const flattenedSchema = flattenObject(schema);

  console.log(flattenedSettings);
  console.log(flattenedSchema);

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
        console.log(error);
        errors.push({ field: key, message: error.message });
      } else {
        throw error;
      }
    }

    if (errors.length > 0) {
      const errorMessage = constructErrorMessage(errors);
      throw new Error(errorMessage);
    }
  }
};
