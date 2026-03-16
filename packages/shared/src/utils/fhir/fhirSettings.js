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
  nullLastNameValue: 'NoLastName',
  assigners: {
    patientDisplayId: 'Tamanu',
    patientDrivingLicense: 'RTA',
    patientPassport: 'Fiji Passport Office',
  },
  dataDictionaries: {
    testMethod: 'http://tamanu.io/data-dictionary/covid-test-methods',
    patientDisplayId: 'http://tamanu.io/data-dictionary/application-reference-number.html',
    labRequestDisplayId: 'http://tamanu.io/data-dictionary/labrequest-reference-number.html',
    areaExternalCode: 'http://data-dictionary.tamanu-fiji.org/rispacs-billing-code.html',
    encounterClass: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    pharmacyOrderPrescriptionId: 'http://data-dictionary.tamanu.org/tamanu-mrid-pharmacyorderprescription.html',
    pharmacyOrderId: 'http://data-dictionary.tamanu.org/tamanu-mrid-pharmacyorder.html',
    medicationCodeSystem: 'http://data-dictionary.tamanu.org/tamanu-msupplyuniveralcodes.html',
    medicationRouteCodeSystem: 'http://data-dictionary.tamanu.org/tamanu-medicationroutecodes.html',
    serviceRequestImagingDisplayId: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
    serviceRequestImagingId: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html',
    serviceRequestImagingTypeCodeSystem: 'http://tamanu.io/data-dictionary/imaging-type-code.html',
    serviceRequestLabDisplayId: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-labrequest.html',
    serviceRequestLabId: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-labrequest.html',
    serviceRequestLabPanelCodeSystem: 'https://www.senaite.com/profileCodes.html',
    serviceRequestLabPanelExternalCodeSystem: 'http://loinc.org',
    serviceRequestLabTestCodeSystem: 'https://www.senaite.com/testCodes.html',
    serviceRequestLabTestExternalCodeSystem: 'http://loinc.org',
    imagingStudyAccessionId: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
    ethnicityId: 'http://data-dictionary.tamanu-fiji.org/extensions/ethnic-group-code.html',
    locationPhysicalType: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
    specimenType: 'http://www.senaite.com/data/sample_types',
    sampleBodySite: 'http://bodySITE.NEW',
    ips: {
      medicationEncoding: 'http://nzmt.org.nz',
      allergyIntoleranceEncoding: 'http://snomed.info/sct',
      conditionEncoding: 'http://snomed.info/sct',
      immunizationEncoding: 'http://nzmt.org.nz',
      absentUnknown: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
    },
  },
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
      countDefault: fhir.parameters._count.default,
      countMax: fhir.parameters._count.max,
      concurrency: fhir.worker.concurrency,
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

export function getFhirNullLastNameValue() {
  return settings.nullLastNameValue;
}

export function getFhirAssigners() {
  return settings.assigners;
}

export function getFhirDataDictionaries() {
  return settings.dataDictionaries;
}
