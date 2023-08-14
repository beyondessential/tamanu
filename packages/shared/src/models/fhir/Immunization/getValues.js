import { VACCINE_STATUS, INJECTION_SITE_OPTIONS } from '@tamanu/constants';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirReference,
  FhirImmunizationPerformer,
  FhirImmunizationProtocolApplied,
} from '../../../services/fhirTypes';
import { formatFhirDate } from '../../../utils/fhir';

export async function getValues(upstream, models) {
  const { AdministeredVaccine } = models;

  if (upstream instanceof AdministeredVaccine) return getValuesFromAdministeredVaccine(upstream);
  throw new Error(`Invalid upstream type for immunization ${upstream.constructor.name}`);
}

async function getValuesFromAdministeredVaccine(administeredVaccine) {
  const { encounter, scheduledVaccine, recorder } = administeredVaccine;
  const { patient } = encounter;

  return {
    lastUpdated: new Date(),
    status: status(administeredVaccine.status),
    vaccineCode: vaccineCode(scheduledVaccine),
    patient: patientReference(patient),
    encounter: encounterReference(encounter),
    occurrenceDateTime: formatFhirDate(administeredVaccine.date),
    lotNumber: administeredVaccine.batch,
    site: site(administeredVaccine.injectionSite),
    performer: performer(recorder),
    protocolApplied: protocolApplied(scheduledVaccine.schedule),
  };
}

function status(administeredVaccineStatus) {
  switch (administeredVaccineStatus) {
    case VACCINE_STATUS.GIVEN:
      return 'completed';
    case VACCINE_STATUS.RECORDED_IN_ERROR:
      return 'entered-in-error';
    case VACCINE_STATUS.NOT_GIVEN:
    case VACCINE_STATUS.SCHEDULED:
    case VACCINE_STATUS.MISSED:
    case VACCINE_STATUS.DUE:
    case VACCINE_STATUS.UPCOMING:
    case VACCINE_STATUS.OVERDUE:
    case VACCINE_STATUS.UNKNOWN:
    default:
      return 'not-done';
  }
}

function vaccineCode(scheduledVaccine) {
  function vaccineIdToAIRVCode(vaccineId) {
    switch (vaccineId) {
      case KNOWN_VACCINE_IDS.PFIZER:
        return KNOWN_AIRV_CODES.COMIRN;
      case KNOWN_VACCINE_IDS.ASTRAZENECA:
        return KNOWN_AIRV_CODES.COVAST;
      default:
        return null;
    }
  }

  // AIRV: Australian Immunisation Register Vaccine
  const AIRV_TERMINOLOGY_URL =
    'https://www.healthterminologies.gov.au/integration/R4/fhir/ValueSet/australian-immunisation-register-vaccine-1';

  // All known vaccines are reference data IDs (type 'drug')
  const KNOWN_VACCINE_IDS = {
    PFIZER: 'drug-COVID-19-Pfizer',
    ASTRAZENECA: 'drug-COVAX',
  };

  // All currently supported AIRV vaccine codes
  const KNOWN_AIRV_CODES = {
    COMIRN: 'COMIRN',
    COVAST: 'COVAST',
  };

  const code = vaccineIdToAIRVCode(scheduledVaccine.vaccine.id);

  // Only include a coding if we support the code, otherwise just use text
  return new FhirCodeableConcept({
    ...(code && {
      coding: [
        new FhirCoding({
          system: AIRV_TERMINOLOGY_URL,
          code,
        }),
      ],
    }),
    text: scheduledVaccine.vaccine.name,
  });
}

function patientReference(patient) {
  return new FhirReference({
    reference: `Patient/${patient.id}`,
    display: [patient.firstName, patient.lastName].filter(x => x).join(' '),
  });
}

function encounterReference(encounter) {
  return new FhirReference({
    reference: `Encounter/${encounter.id}`,
  });
}

function site(injectionSite) {
  const HL7_INJECTION_SITE_URL = 'http://terminology.hl7.org/CodeSystem/v3-ActSite';

  // Dictionary that maps Tamanu injection site to HL7 code
  const INJECTION_SITE_TO_HL7_CODE = {
    [INJECTION_SITE_OPTIONS.RIGHT_ARM]: 'RA',
    [INJECTION_SITE_OPTIONS.LEFT_ARM]: 'LA',
    [INJECTION_SITE_OPTIONS.RIGHT_THIGH]: 'RT',
    [INJECTION_SITE_OPTIONS.LEFT_THIGH]: 'LT',
  };

  return [
    new FhirCodeableConcept({
      coding: [
        new FhirCoding({
          system: HL7_INJECTION_SITE_URL,
          code: INJECTION_SITE_TO_HL7_CODE[injectionSite] || null,
          display: injectionSite,
        }),
      ],
    }),
  ];
}

function performer(recorder) {
  if (!recorder) return [];

  return [
    new FhirImmunizationPerformer({
      actor: new FhirReference({
        reference: `Practitioner/${recorder.id}`,
      }),
    }),
  ];
}

function protocolApplied(schedule) {
  return [
    new FhirImmunizationProtocolApplied({
      doseNumberString: schedule,
    }),
  ];
}
