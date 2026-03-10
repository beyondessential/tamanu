import config from 'config';

let _cache = null;

/**
 * Initialise the FHIR settings cache from the database via ReadSettings.
 * Must be called during server startup before any FHIR code runs.
 */
export async function initFhirSettingsFromDb(models) {
  const { ReadSettings } = await import('@tamanu/settings');
  const reader = new ReadSettings(models);

  const [resourceMaterialisationEnabled, countDefault, countMax] = await Promise.all([
    reader.get('fhir.worker.resourceMaterialisationEnabled'),
    reader.get('fhir.parameters._count.default'),
    reader.get('fhir.parameters._count.max'),
  ]);

  _cache = {
    resourceMaterialisationEnabled: resourceMaterialisationEnabled ?? {},
    countDefault: countDefault ?? null,
    countMax: countMax ?? null,
  };
}

function getConfigFallback() {
  return {
    resourceMaterialisationEnabled:
      config?.integrations?.fhir?.worker?.resourceMaterialisationEnabled ?? {},
    countDefault: config?.integrations?.fhir?.parameters?._count?.default ?? null,
    countMax: config?.integrations?.fhir?.parameters?._count?.max ?? null,
  };
}

export function getFhirWorkerConfig() {
  const source = _cache ?? getConfigFallback();
  return {
    enabled: config?.integrations?.fhir?.worker?.enabled ?? false,
    resourceMaterialisationEnabled: source.resourceMaterialisationEnabled,
  };
}

export function getFhirCountConfig() {
  const source = _cache ?? getConfigFallback();
  return {
    default: source.countDefault,
    max: source.countMax,
  };
}

/** Visible for testing */
export function resetFhirSettingsCache() {
  _cache = null;
}
