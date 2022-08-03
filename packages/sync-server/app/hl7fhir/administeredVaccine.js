import { format } from 'date-fns';

import { VACCINE_STATUS, INJECTION_SITE_OPTIONS } from 'shared/constants';
import { parseHL7Reference } from './utils';

// These are the only ones that we support at the moment,
// so OK to hardcode them for now.
const HL7_INJECTION_SITE_URL = 'http://terminology.hl7.org/CodeSystem/v3-ActSite';
const AIRV_TERMINOLOGY_URL =
  'https://www.healthterminologies.gov.au/integration/R4/fhir/ValueSet/australian-immunisation-register-vaccine-1';

function administeredVaccineStatusToHL7Status(status) {
  switch (status) {
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
      return 'not-done';
    default:
      throw new Error(`Administered vaccine status is not one of []: ${status}`);
  }
}

// All known vaccines are reference data IDs (type 'drug')
const KNOWN_VACCINE_IDS = {
  PFIZER: 'drug-COVID-19-Pfizer',
  ASTRAZENECA: 'drug-COVAX',
};

// AIRV: Australian Immunisation Register Vaccine
function vaccineIdToAIRVCode(scheduledVaccine) {
  const vaccineId = scheduledVaccine.vaccine.id;
  switch (vaccineId) {
    case KNOWN_VACCINE_IDS.PFIZER:
      return 'COMIRN';
    case KNOWN_VACCINE_IDS.ASTRAZENECA:
      return 'COVAST';
    default:
      throw new Error(`Unrecognized vaccine ID ${vaccineId}`);
  }
}

function patientToHL7Reference(patient) {
  return {
    reference: `Patient/${patient.id}`,
    display: [patient.firstName, patient.lastName].filter(x => x).join(' '),
  };
}

function encounterToHL7Reference(encounter) {
  return {
    reference: `Encounter/${encounter.id}`,
  };
}

function injectionSiteToHL7Code(injectionSite) {
  switch (injectionSite) {
    case INJECTION_SITE_OPTIONS.RIGHT_ARM:
      return 'RA';
    case INJECTION_SITE_OPTIONS.LEFT_ARM:
      return 'LA';
    case INJECTION_SITE_OPTIONS.RIGHT_THIGH:
      return 'RT';
    case INJECTION_SITE_OPTIONS.LEFT_THIGH:
      return 'LT';
    default:
      return null;
  }
}

function practitionerToHL7Reference(practitioner) {
  return {
    reference: `Practitioner/${practitioner.id}`,
  };
}

export function administeredVaccineToHL7Immunization(administeredVaccine) {
  const { encounter, scheduledVaccine, recorder, injectionSite } = administeredVaccine;
  const { patient } = encounter;

  return {
    resourceType: 'Immunization',
    id: administeredVaccine.id,
    status: administeredVaccineStatusToHL7Status(administeredVaccine.status),
    vaccineCode: {
      coding: [
        {
          system: AIRV_TERMINOLOGY_URL,
          code: vaccineIdToAIRVCode(scheduledVaccine),
        },
      ],
    },
    patient: patientToHL7Reference(patient),
    encounter: encounterToHL7Reference(encounter),
    occurrenceDateTime: format(administeredVaccine.date, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    lotNumber: administeredVaccine.batch,
    site: {
      coding: [
        {
          system: HL7_INJECTION_SITE_URL,
          code: injectionSiteToHL7Code(injectionSite),
          display: injectionSite,
        },
      ],
    },
    performer: [
      {
        actor: practitionerToHL7Reference(recorder),
      },
    ],
    protocolApplied: {
      doseNumber: scheduledVaccine.schedule,
    },
  };
}

export function getAdministeredVaccineInclude(_, query) {
  const { patient, 'vaccine-code': vaccineId } = query;

  return [
    { association: 'recorder', required: true },
    {
      association: 'scheduledVaccine',
      required: true,
      include: [
        {
          association: 'vaccine',
          required: true,
          ...(vaccineId && { where: { id: vaccineId } }),
        },
      ],
    },
    {
      association: 'encounter',
      required: true,
      include: [
        {
          association: 'patient',
          required: true,
          ...(patient && { where: { displayId: parseHL7Reference(patient) } }),
        },
      ],
    },
  ];
}
