import config from 'config';
import { resetParametersCache } from './parameters';

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

export async function initFhirSettingsFromDb(models) {
  try {
    const { ReadSettings } = await import('@tamanu/settings');
    const reader = new ReadSettings(models);

    const [resourceMaterialisationEnabled, countDefault, countMax] = await Promise.all([
      reader.get('fhir.worker.resourceMaterialisationEnabled'),
      reader.get('fhir.parameters._count.default'),
      reader.get('fhir.parameters._count.max'),
    ]);

    cache = {
      resourceMaterialisationEnabled: resourceMaterialisationEnabled ?? DEFAULTS.resourceMaterialisationEnabled,
      countDefault: countDefault ?? DEFAULTS.countDefault,
      countMax: countMax ?? DEFAULTS.countMax,
    };
  } catch {
    // Settings table may not exist yet (e.g. during upgrade before migrations)
    cache = null;
  }
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
  resetParametersCache();
}
