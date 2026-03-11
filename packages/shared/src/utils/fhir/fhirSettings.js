import config from 'config';
import {
  extractDefaults,
  fhirResourceMaterialisationSchema,
  fhirCountParametersSchema,
} from '@tamanu/settings';
import { log } from '../../services/logging';

const matDefaults = extractDefaults(fhirResourceMaterialisationSchema);
const countDefaults = extractDefaults(fhirCountParametersSchema);

const DEFAULTS = {
  resourceMaterialisationEnabled: matDefaults,
  countDefault: countDefaults._count.default,
  countMax: countDefaults._count.max,
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
    if (facilitySettings.length > 0) {
      const [globalCountDefault, globalCountMax, ...perFacility] = await Promise.all([
        globalSettings.get('fhir.parameters._count.default'),
        globalSettings.get('fhir.parameters._count.max'),
        ...facilitySettings.map(fs => fs.get('fhir.worker.resourceMaterialisationEnabled')),
      ]);

      const mergedMatEnabled = Object.fromEntries(
        Object.keys(DEFAULTS.resourceMaterialisationEnabled).map(k => [k, false]),
      );
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
      };
    } else {
      const [globalCountDefault, globalCountMax, globalMatEnabled] = await Promise.all([
        globalSettings.get('fhir.parameters._count.default'),
        globalSettings.get('fhir.parameters._count.max'),
        globalSettings.get('fhir.worker.resourceMaterialisationEnabled'),
      ]);

      settings = { // eslint-disable-line require-atomic-updates
        resourceMaterialisationEnabled: globalMatEnabled ?? DEFAULTS.resourceMaterialisationEnabled,
        countDefault: globalCountDefault ?? DEFAULTS.countDefault,
        countMax: globalCountMax ?? DEFAULTS.countMax,
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
