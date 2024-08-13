import { SETTINGS_SCOPES } from '@tamanu/constants';
import { globalSettings } from './global';
import { centralSettings } from './central';
import { facilitySettings } from './facility';
import * as yup from 'yup';
import _ from 'lodash';

const SCOPE_TO_SCHEMA = {
  [SETTINGS_SCOPES.GLOBAL]: globalSettings,
  [SETTINGS_SCOPES.CENTRAL]: centralSettings,
  [SETTINGS_SCOPES.FACILITY]: facilitySettings,
};

const flattenObject = (obj: any, parentKey: string = ''): any => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    if (_.isObject(value) && !(value as { schema?: any }).schema) {
      Object.assign(acc, flattenObject(value, fullKey));
    } else {
      acc[fullKey] = value;
    }
    return acc;
  }, {});
};

export const validateSettings = async ({ settings, scope = null, schema }) => {
  if (scope) schema = SCOPE_TO_SCHEMA[scope];

  const flattenedSettings = flattenObject(settings);
  const flattenedSchema = flattenObject(schema);

  console.log(flattenedSettings);
  console.log(flattenedSchema);

  const errors = [];

  for (const [key, value] of Object.entries(flattenedSettings)) {
    if (flattenedSchema[key] && flattenedSchema[key].schema) {
      try {
        await flattenedSchema[key].schema.validate(value);
      } catch (error) {
        if (error instanceof yup.ValidationError) {
          errors.push({ field: key, message: error.message });
        } else {
          throw error;
        }
      }
    } else {
      console.warn(`Unknown setting: ${key}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed for the following fields: ${JSON.stringify(errors)}`);
  }
};
