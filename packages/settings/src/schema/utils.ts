import {
  isObject,
  isUndefined,
  mapValues,
  omitBy,
  get as getAtPath,
  set as setAtPath,
  cloneDeep,
} from 'lodash';
import { Setting, SettingsSchema } from '../types';

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
 * Secret fields that have a value (including empty strings) will be replaced with a placeholder.
 * This is used when returning settings to the admin UI.
 */
export const maskSecrets = (
  settings: Record<string, unknown>,
  secretPaths: string[],
): Record<string, unknown> => {
  const masked = cloneDeep(settings);

  for (const path of secretPaths) {
    const value = getAtPath(masked, path);
    // Mask if the value exists (including empty strings, which are valid secrets)
    if (value !== undefined && value !== null) {
      setAtPath(masked, path, SECRET_PLACEHOLDER);
    }
  }

  return masked;
};

/**
 * Checks if a given path is a secret in the schema.
 */
export const isSecretPath = (schema: SettingsSchema, path: string): boolean => {
  const secretPaths = extractSecretPaths(schema);
  return secretPaths.includes(path);
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
