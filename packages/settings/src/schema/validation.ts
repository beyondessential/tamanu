import { SETTINGS_SCOPES } from '@tamanu/constants';
import { globalSettings } from './global';
import { centralSettings } from './central';
import { facilitySettings } from './facility';
import * as yup from 'yup';
import _, { cloneDeep, isArray, mergeWith } from 'es-toolkit/compat';
import { SettingsSchema } from '../types';
import { extractDefaults, isSetting } from './utils';

const SCOPE_TO_SCHEMA = {
  [SETTINGS_SCOPES.GLOBAL]: globalSettings,
  [SETTINGS_SCOPES.CENTRAL]: centralSettings,
  [SETTINGS_SCOPES.FACILITY]: facilitySettings,
};

// Flattening stops at keys the schema declares as settings, so an object-typed
// setting (e.g. imagingTypes) reaches its yup schema whole instead of
// dissolving into leaf keys the schema doesn't know (and never validating).
const flattenSettings = (obj: unknown, settingKeys: Set<string>, parentKey = '') => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (_.isObject(value) && !Array.isArray(value) && !settingKeys.has(fullKey)) {
      Object.assign(acc, flattenSettings(value, settingKeys, fullKey));
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
      acc[fullKey] = value.secret ? value.type.nullable() : value.type;
    } else {
      Object.assign(acc, flattenSchema(value, fullKey));
    }

    return acc;
  }, {} as Record<string, yup.AnySchema>);
};

export const getScopedSchema = (scope: string) => {
  return SCOPE_TO_SCHEMA[scope];
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
  const schemaValue = scope ? getScopedSchema(scope) : schema;

  if (!schemaValue) {
    throw new Error(`No schema found for scope: ${scope}`);
  }

  const flattenedSchema = flattenSchema(schemaValue);
  const flattenedSettings = flattenSettings(settings, new Set(Object.keys(flattenedSchema)));
  const yupSchema = yup
    .object()
    .shape(flattenedSchema);

  await yupSchema.validate(flattenedSettings, { abortEarly: false, strict: true });
};

/**
 * Applies default values to all settings in the given scope that are not already set.
 */
export const applyDefaults = (settings: Record<string, unknown>, scope: string) => {
  const schema = getScopedSchema(scope);
  const defaults = cloneDeep(extractDefaults(schema));
  return mergeWith(
    defaults,
    settings,
    (_, settingValue) => (isArray(settingValue) ? settingValue : undefined), // Replace, don’t merge arrays
  );
};
