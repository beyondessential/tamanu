import config from 'config';
import { ReadSettings } from '@tamanu/settings';

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

let settings = null;

/**
 * Load FHIR settings from the database at server startup.
 * The result is held for the lifetime of the process; changes require a restart.
 *
 * @param {object} models - Sequelize models
 * @param {string[]} [facilityIds] - Facility IDs for omni-facility servers.
 *   When provided, resourceMaterialisationEnabled is the union across all facilities
 *   (enabled if ANY facility enables it). Count params stay global.
 */
export async function initFhirSettingsFromDb(models, facilityIds = []) {
  try {
    const globalReader = new ReadSettings(models);

    const [globalCountDefault, globalCountMax] = await Promise.all([
      globalReader.get('fhir.parameters._count.default'),
      globalReader.get('fhir.parameters._count.max'),
    ]);

    let mergedMatEnabled;

    if (facilityIds.length > 0) {
      const perFacility = await Promise.all(
        facilityIds.map(id =>
          new ReadSettings(models, id).get('fhir.worker.resourceMaterialisationEnabled'),
        ),
      );

      mergedMatEnabled = Object.fromEntries(
        Object.keys(DEFAULTS.resourceMaterialisationEnabled).map(k => [k, false]),
      );
      for (const fs of perFacility) {
        if (!fs) continue;
        for (const [key, val] of Object.entries(fs)) {
          if (val) mergedMatEnabled[key] = true;
        }
      }
    } else {
      const globalMatEnabled = await globalReader.get(
        'fhir.worker.resourceMaterialisationEnabled',
      );
      mergedMatEnabled = globalMatEnabled ?? DEFAULTS.resourceMaterialisationEnabled;
    }

    settings = {
      resourceMaterialisationEnabled: mergedMatEnabled,
      countDefault: globalCountDefault ?? DEFAULTS.countDefault,
      countMax: globalCountMax ?? DEFAULTS.countMax,
    };
  } catch {
    // Settings table may not exist yet (e.g. during upgrade before migrations)
    settings = null;
  }
}

export function getFhirWorkerConfig() {
  const s = settings ?? DEFAULTS;
  return {
    enabled: config?.integrations?.fhir?.worker?.enabled ?? false,
    resourceMaterialisationEnabled: s.resourceMaterialisationEnabled,
  };
}

export function getFhirCountConfig() {
  const s = settings ?? DEFAULTS;
  return {
    default: s.countDefault,
    max: s.countMax,
  };
}
