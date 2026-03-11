import config from 'config';
import { resetParametersCache } from './parameters';
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
};

let cache = null;
let _models = null;
let _facilityIds = [];

async function loadFromDb() {
  if (!_models) return;
  try {
    const { ReadSettings } = await import('@tamanu/settings');
    const globalReader = new ReadSettings(_models);

    const [globalCountDefault, globalCountMax] = await Promise.all([
      globalReader.get('fhir.parameters._count.default'),
      globalReader.get('fhir.parameters._count.max'),
    ]);

    let mergedMatEnabled;

    if (_facilityIds.length > 0) {
      // Omni-facility: read effective settings per facility (global + facility merged
      // by ReadSettings) then union across all facilities on this server — if ANY
      // facility enables a resource, the server must materialise it.
      const perFacility = await Promise.all(
        _facilityIds.map(id => new ReadSettings(_models, id).get('fhir.worker.resourceMaterialisationEnabled')),
      );

      mergedMatEnabled = { ...DEFAULTS.resourceMaterialisationEnabled };
      for (const fs of perFacility) {
        if (!fs) continue;
        for (const [key, val] of Object.entries(fs)) {
          if (val) mergedMatEnabled[key] = true;
        }
      }
    } else {
      const globalMatEnabled = await globalReader.get('fhir.worker.resourceMaterialisationEnabled');
      mergedMatEnabled = globalMatEnabled ?? DEFAULTS.resourceMaterialisationEnabled;
    }

    cache = {
      resourceMaterialisationEnabled: mergedMatEnabled,
      countDefault: globalCountDefault ?? DEFAULTS.countDefault,
      countMax: globalCountMax ?? DEFAULTS.countMax,
    };
  } catch {
    // Settings table may not exist yet (e.g. during upgrade before migrations)
    cache = null;
  }
}

/**
 * @param {object} models - Sequelize models
 * @param {string[]} [facilityIds] - Facility IDs for omni-facility servers.
 *   When provided, resourceMaterialisationEnabled is merged across all facilities
 *   (union — enable if any facility enables). Count params stay global.
 */
export async function initFhirSettingsFromDb(models, facilityIds = []) {
  _models = models;
  _facilityIds = facilityIds;
  await loadFromDb();
}

export async function refreshFhirSettingsIfInitialized() {
  if (!_models) return;
  await loadFromDb();
  resetParametersCache();
  log.debug('FHIR settings cache refreshed from database');
}

function resolve() {
  return cache ?? DEFAULTS;
}

export function getFhirWorkerConfig() {
  return {
    enabled: config?.integrations?.fhir?.worker?.enabled ?? false,
    resourceMaterialisationEnabled: resolve().resourceMaterialisationEnabled,
  };
}

export function getFhirCountConfig() {
  const source = resolve();
  return {
    default: source.countDefault,
    max: source.countMax,
  };
}

export function resetFhirSettingsCache() {
  cache = null;
  _models = null;
  _facilityIds = [];
  resetParametersCache();
}
