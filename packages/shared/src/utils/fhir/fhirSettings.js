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
    const globalPromises = [
      globalSettings.get('fhir.parameters._count.default'),
      globalSettings.get('fhir.parameters._count.max'),
      globalSettings.get('fhir.worker.concurrency'),
      globalSettings.get('fhir.extensions'),
    ];

    if (facilitySettings.length > 0) {
      const [
        globalCountDefault, globalCountMax, concurrency, extensions,
        globalMatEnabled, ...perFacility
      ] = await Promise.all([
          ...globalPromises,
          globalSettings.get('fhir.worker.resourceMaterialisationEnabled'),
          ...facilitySettings.map(fs => fs.get('fhir.worker.resourceMaterialisationEnabled')),
        ]);

      const baseMatEnabled = globalMatEnabled ?? DEFAULTS.resourceMaterialisationEnabled;
      const mergedMatEnabled = { ...baseMatEnabled };
      for (const fs of perFacility) {
        if (!fs) continue;
        for (const [key, val] of Object.entries(fs)) {
          if (val) mergedMatEnabled[key] = true;
        }
      }

      settings = { // eslint-disable-line require-atomic-updates
        resourceMaterialisationEnabled: mergedMatEnabled,
        countDefault: globalCountDefault ?? DEFAULTS.countDefault,
        countMax: globalCountMax ?? DEFAULTS.countMax,
        concurrency: concurrency ?? DEFAULTS.concurrency,
        extensions: extensions ?? DEFAULTS.extensions,
      };
    } else {
      const [globalCountDefault, globalCountMax, concurrency, extensions, globalMatEnabled] =
        await Promise.all([
          ...globalPromises,
          globalSettings.get('fhir.worker.resourceMaterialisationEnabled'),
        ]);

      settings = { // eslint-disable-line require-atomic-updates
        resourceMaterialisationEnabled: globalMatEnabled ?? DEFAULTS.resourceMaterialisationEnabled,
        countDefault: globalCountDefault ?? DEFAULTS.countDefault,
        countMax: globalCountMax ?? DEFAULTS.countMax,
        concurrency: concurrency ?? DEFAULTS.concurrency,
        extensions: extensions ?? DEFAULTS.extensions,
      };
    }
  } catch (error) {
    log.warn('Failed to load FHIR settings from DB, using defaults', error.message);
    settings = null; // eslint-disable-line require-atomic-updates
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
