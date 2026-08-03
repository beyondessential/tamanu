import { globalDefaults } from '@tamanu/settings';

const fhirDefaults = globalDefaults.fhir;
const DEFAULTS = {
  // The enable flags are per server type (central/facility scope), so there is no global
  // default to fall back on: off until loaded from the DB at startup.
  workerEnabled: false,
  resourceMaterialisationEnabled: fhirDefaults.worker.resourceMaterialisationEnabled,
  extensions: fhirDefaults.extensions,
  nullLastNameValue: fhirDefaults.nullLastNameValue,
  assigners: fhirDefaults.assigners,
  dataDictionaries: fhirDefaults.dataDictionaries,
};

let settings = structuredClone(DEFAULTS);
let loaded = false;

/** Reset cached settings so the next call to initFhirSettingsFromDb reloads from DB. */
export function resetFhirSettings() {
  settings = structuredClone(DEFAULTS);
  loaded = false;
}

/**
 * Load FHIR settings from the database at server startup.
 * Cached for the process lifetime (these settings have requiresRestart: true in the schema).
 *
 * @param {ReadSettings} globalSettings - global-scoped settings reader
 * @param {ReadSettings[]} [facilitySettings] - facility-scoped settings readers.
 *   resourceMaterialisationEnabled is union-merged across facilities so a single
 *   worker pool materialises everything needed.
 */
export async function initFhirSettingsFromDb(globalSettings, facilitySettings = []) {
  if (loaded) return;

  const fhir = await globalSettings.get('fhir');

  const globalMatEnabled = fhir.worker.resourceMaterialisationEnabled;

  const perFacilityResults = await Promise.all(
    facilitySettings.map(fs => fs.get('fhir.worker.resourceMaterialisationEnabled')),
  );
  let mergedMatEnabled = { ...globalMatEnabled };
  for (const perFacility of perFacilityResults) {
    if (!perFacility) continue;
    for (const [key, val] of Object.entries(perFacility)) {
      if (val) mergedMatEnabled[key] = true;
    }
  }

  // `fhir.worker.enabled` is scoped to the server type, so on a facility server it comes from
  // a facility reader (which merges facility over global) rather than the global-only one.
  const [primaryFacilitySettings] = facilitySettings;
  const { worker } = primaryFacilitySettings ? await primaryFacilitySettings.get('fhir') : fhir;

  settings = {
    workerEnabled: Boolean(worker.enabled),
    resourceMaterialisationEnabled: mergedMatEnabled,
    extensions: fhir.extensions,
    nullLastNameValue: fhir.nullLastNameValue,
    assigners: fhir.assigners,
    dataDictionaries: fhir.dataDictionaries,
  };
  // eslint-disable-next-line require-atomic-updates
  loaded = true;
}

export function getFhirWorkerSettings() {
  return {
    enabled: settings.workerEnabled,
    resourceMaterialisationEnabled: settings.resourceMaterialisationEnabled,
  };
}

export function getFhirExtensionSettings() {
  return settings.extensions;
}

export function getFhirNullLastNameValue() {
  return settings.nullLastNameValue;
}

export function getFhirAssigners() {
  return settings.assigners;
}

export function getFhirDataDictionaries() {
  return settings.dataDictionaries;
}
