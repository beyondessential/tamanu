import config from 'config';
import { log } from '../../services/logging';

const DEFAULTS = {
  resourceMaterialisationEnabled: {
    Patient: true,
    Encounter: false,
    Immunization: false,
    MediciReport: false,
    Organization: false,
    Practitioner: false,
    ServiceRequest: false,
    Specimen: false,
    MedicationRequest: false,
    DiagnosticReport: false,
  },
  countDefault: 100,
  countMax: 1000,
  concurrency: 10,
  extensions: { Patient: { newZealandEthnicity: false } },
};

let settings = { ...DEFAULTS };
let initialised = false;

/** Reset cached settings so the next call to initFhirSettingsFromDb reloads from DB. */
export function resetFhirSettings() {
  settings = { ...DEFAULTS };
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
      countDefault: fhir.parameters._count.default,
      countMax: fhir.parameters._count.max,
      concurrency: fhir.worker.concurrency,
      extensions: fhir.extensions,
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
    concurrency: settings.concurrency,
    resourceMaterialisationEnabled: settings.resourceMaterialisationEnabled,
  };
}

export function getFhirCountSettings() {
  return {
    default: settings.countDefault,
    max: settings.countMax,
  };
}

export function getFhirExtensionSettings() {
  return settings.extensions;
}
