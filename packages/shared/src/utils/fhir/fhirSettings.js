import config from 'config';
import { globalDefaults } from '@tamanu/settings';

const fhirDefaults = globalDefaults.fhir;
const DEFAULTS = {
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
 * @param {ReadSettings} settingsReader - central reader on central; the server
 *   (machine-scope) reader on facility servers, whose cascade resolves the
 *   per-server resourceMaterialisationEnabled override before the global value.
 */
export async function initFhirSettingsFromDb(settingsReader) {
  if (loaded) return;

  const fhir = await settingsReader.get('fhir');

  settings = {
    resourceMaterialisationEnabled: fhir.worker.resourceMaterialisationEnabled,
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
