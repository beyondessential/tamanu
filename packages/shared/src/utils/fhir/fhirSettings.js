import config from 'config';
import {
  extractDefaults,
  fhirResourceMaterialisationSchema,
  fhirWorkerConcurrencySchema,
  fhirCountParametersSchema,
  fhirExtensionsSchema,
} from '@tamanu/settings';
import { log } from '../../services/logging';

const matDefaults = extractDefaults(fhirResourceMaterialisationSchema);
const countDefaults = extractDefaults(fhirCountParametersSchema);
const extensionsDefaults = extractDefaults(fhirExtensionsSchema);

const DEFAULTS = {
  resourceMaterialisationEnabled: matDefaults,
  countDefault: countDefaults._count.default,
  countMax: countDefaults._count.max,
  concurrency: fhirWorkerConcurrencySchema.defaultValue,
  extensions: extensionsDefaults,
};

let settings = null;
let generation = 0;

export function getFhirSettingsGeneration() {
  return generation;
}

/** Reset cached settings so the next call to initFhirSettingsFromDb reloads from DB. */
export function resetFhirSettings() {
  settings = null;
  generation++;
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
  if (settings !== null) return;

  try {
    const fhir = await globalSettings.get('fhir');

    const globalMatEnabled =
      fhir?.worker?.resourceMaterialisationEnabled ?? DEFAULTS.resourceMaterialisationEnabled;

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
      countDefault: fhir?.parameters?._count?.default ?? DEFAULTS.countDefault,
      countMax: fhir?.parameters?._count?.max ?? DEFAULTS.countMax,
      concurrency: fhir?.worker?.concurrency ?? DEFAULTS.concurrency,
      extensions: fhir?.extensions ?? DEFAULTS.extensions,
    };
  } catch (error) {
    log.error('Failed to load FHIR settings from DB:', error.message);
    throw error;
  }
}

export function getFhirWorkerSettings() {
  const s = settings ?? DEFAULTS;
  return {
    enabled: config?.integrations?.fhir?.worker?.enabled ?? false,
    concurrency: s.concurrency,
    resourceMaterialisationEnabled: s.resourceMaterialisationEnabled,
  };
}

export function getFhirCountSettings() {
  const s = settings ?? DEFAULTS;
  return {
    default: s.countDefault,
    max: s.countMax,
  };
}

export function getFhirExtensionSettings() {
  const s = settings ?? DEFAULTS;
  return s.extensions;
}
