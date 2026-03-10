import config from 'config';

import { resetParametersCache } from './parameters';

let _cache = null;

async function loadSchemaDefaults() {
  const { extractDefaults, fhirResourceMaterialisationSchema, fhirCountParametersSchema } =
    await import('@tamanu/settings');
  const resourceDefaults = extractDefaults(fhirResourceMaterialisationSchema);
  const countDefaults = extractDefaults(fhirCountParametersSchema);
  return {
    resourceMaterialisationEnabled: resourceDefaults,
    countDefault: countDefaults._count.default,
    countMax: countDefaults._count.max,
  };
}

/**
 * Initialise the FHIR settings cache from the database via ReadSettings.
 * Must be called during server startup before any FHIR code runs.
 */
export async function initFhirSettingsFromDb(models) {
  const { ReadSettings } = await import('@tamanu/settings');
  const reader = new ReadSettings(models);
  const defaults = await loadSchemaDefaults();

  const [resourceMaterialisationEnabled, countDefault, countMax] = await Promise.all([
    reader.get('fhir.worker.resourceMaterialisationEnabled'),
    reader.get('fhir.parameters._count.default'),
    reader.get('fhir.parameters._count.max'),
  ]);

  _cache = {
    resourceMaterialisationEnabled: resourceMaterialisationEnabled ?? defaults.resourceMaterialisationEnabled,
    countDefault: countDefault ?? defaults.countDefault,
    countMax: countMax ?? defaults.countMax,
  };
}

/**
 * Initialise the cache with schema defaults only (no database).
 * Used in test mode where the settings DB is not available at init time.
 */
export async function initFhirSettingsDefaults() {
  _cache = await loadSchemaDefaults();
}

export function getFhirWorkerConfig() {
  return {
    enabled: config?.integrations?.fhir?.worker?.enabled ?? false,
    resourceMaterialisationEnabled: _cache?.resourceMaterialisationEnabled ?? {},
  };
}

export function getFhirCountConfig() {
  return {
    default: _cache?.countDefault ?? null,
    max: _cache?.countMax ?? null,
  };
}

/** Visible for testing */
export function resetFhirSettingsCache() {
  _cache = null;
  resetParametersCache();
}
