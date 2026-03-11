import config from 'config';
import {
  ReadSettings,
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
 * @param {object} models - Sequelize models
 * @param {string[]} [facilityIds] - facility IDs served by this central server.
 *   resourceMaterialisationEnabled is union-merged across facilities so a single
 *   worker pool materialises everything needed. Count params are global-scoped.
 */
export async function initFhirSettingsFromDb(models, facilityIds = []) {
  if (settings !== null) return;

  try {
    const globalReader = new ReadSettings(models);

    if (facilityIds.length > 0) {
      const [globalCountDefault, globalCountMax, ...perFacility] = await Promise.all([
        globalReader.get('fhir.parameters._count.default'),
        globalReader.get('fhir.parameters._count.max'),
        ...facilityIds.map(id =>
          new ReadSettings(models, id).get('fhir.worker.resourceMaterialisationEnabled'),
        ),
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
        globalReader.get('fhir.parameters._count.default'),
        globalReader.get('fhir.parameters._count.max'),
        globalReader.get('fhir.worker.resourceMaterialisationEnabled'),
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
