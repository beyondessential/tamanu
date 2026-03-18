import config from 'config';
import { globalDefaults } from '@tamanu/settings';
import { log } from '../../services/logging';

const fhirDefaults = globalDefaults.fhir;
const DEFAULTS = {
  resourceMaterialisationEnabled: fhirDefaults.worker.resourceMaterialisationEnabled,
  extensions: fhirDefaults.extensions,
  nullLastNameValue: fhirDefaults.nullLastNameValue,
  assigners: fhirDefaults.assigners,
  dataDictionaries: fhirDefaults.dataDictionaries,
};

let settings = structuredClone(DEFAULTS);
let initialised = false;

/** Reset cached settings so the next call to initFhirSettingsFromDb reloads from DB. */
export function resetFhirSettings() {
  settings = structuredClone(DEFAULTS);
  initialised = false;
}

/**
 * Load FHIR settings from the database at server startup.
 * Cached for the process lifetime (requiresRestart: true). Subsequent calls are no-ops.
 *
 * @param {ReadSettings} globalSettings - global-scoped settings reader
 * @param {ReadSettings[]} [facilitySettings] - facility-scoped settings readers.
 *   resourceMaterialisationEnabled is union-merged across facilities so a single
 *   worker pool materialises everything needed.
 */
export async function initFhirSettingsFromDb(globalSettings, facilitySettings = []) {
  if (initialised) return;

  try {
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

    settings = { // eslint-disable-line require-atomic-updates
      resourceMaterialisationEnabled: mergedMatEnabled,
      extensions: fhir.extensions,
      nullLastNameValue: fhir.nullLastNameValue,
      assigners: fhir.assigners,
      dataDictionaries: fhir.dataDictionaries,
    };
    initialised = true; // eslint-disable-line require-atomic-updates
  } catch (error) {
    log.error('Failed to load FHIR settings from DB:', error.message);
    throw error;
  }
}

export function getFhirWorkerSettings() {
  return {
    enabled: config?.integrations?.fhir?.worker?.enabled ?? false,
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
