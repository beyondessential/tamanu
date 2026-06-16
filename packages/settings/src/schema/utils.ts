import isObject from 'lodash/isObject.js';
import isUndefined from 'lodash/isUndefined.js';
import mapValues from 'lodash/mapValues.js';
import omitBy from 'lodash/omitBy.js';
import getAtPath from 'lodash/get.js';
import setAtPath from 'lodash/set.js';
import cloneDeep from 'lodash/cloneDeep.js';
import { type Setting, type SettingsSchema } from '../types/index.ts';

export const isSetting = (value: Setting | SettingsSchema): value is Setting => {
  return Boolean(value) && isObject(value) && 'type' in value;
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

/**
 * Extracts all paths in the schema that are marked as secrets.
 * Returns an array of dot-separated paths (e.g., ['integrations.api.key', 'auth.token'])
 */
export const extractSecretPaths = (schema: SettingsSchema, parentKey = ''): string[] => {
  const paths: string[] = [];

  for (const [key, value] of Object.entries(schema.properties)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (isSetting(value)) {
      if (value.secret) {
        paths.push(fullKey);
      }
    } else if (isSettingsSchema(value)) {
      paths.push(...extractSecretPaths(value, fullKey));
    }
  }

  return paths;
};

/**
 * Placeholder value used to indicate that a secret exists but its value is hidden.
 */
export const SECRET_PLACEHOLDER = '••••••••';

/**
 * Masks secret values in a settings object.
 * Secret fields with a non-empty value are replaced with a placeholder; empty,
 * null, or unset values are left as-is so the admin UI shows an empty field
 * (rather than appearing to hide a secret that doesn't actually exist).
 * This is used when returning settings to the admin UI.
 */
export const maskSecrets = (
  settings: Record<string, unknown>,
  secretPaths: string[],
): Record<string, unknown> => {
  const masked = cloneDeep(settings);

  for (const path of secretPaths) {
    const value = getAtPath(masked, path);
    if (value !== undefined && value !== null && value !== '') {
      setAtPath(masked, path, SECRET_PLACEHOLDER);
    }
  }

  return masked;
};

/**
 * Gets the setting definition at a given path, if it exists.
 */
export const getSettingAtPath = (schema: SettingsSchema, path: string): Setting | null => {
  const parts = path.split('.');
  let current: Setting | SettingsSchema = schema;

  for (const part of parts) {
    if (!isSettingsSchema(current)) {
      return null;
    }
    const next = current.properties[part];
    if (!next) {
      return null;
    }
    current = next;
  }

  return isSetting(current) ? current : null;
};

/**
 * Checks if a given path is a secret in the schema.
 */
export const isSecretPath = (schema: SettingsSchema, path: string): boolean => {
  const setting = getSettingAtPath(schema, path);
  return setting?.secret === true;
};
