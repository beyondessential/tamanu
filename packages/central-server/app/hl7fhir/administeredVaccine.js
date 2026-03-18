import { Op } from 'sequelize';
import { format } from '@tamanu/utils/dateTime';

import { INJECTION_SITE_VALUES } from '@tamanu/constants';
import { FhirReference } from '@tamanu/shared/services/fhirTypes';

import { administeredVaccineStatusToHL7Status } from '@tamanu/shared/routes/fhir/patientSummary/utils';
export { administeredVaccineStatusToHL7Status };

// These are the only ones that we support at the moment,
// so OK to hardcode them for now.
const HL7_INJECTION_SITE_URL = 'http://terminology.hl7.org/CodeSystem/v3-ActSite';
const AIRV_TERMINOLOGY_URL =
  'https://www.healthterminologies.gov.au/integration/R4/fhir/ValueSet/australian-immunisation-register-vaccine-1';

// All known vaccines are reference data IDs (type 'drug')
const KNOWN_VACCINE_IDS = {
  PFIZER: 'drug-COVID-19-Pfizer',
  ASTRAZENECA: 'drug-COVAX',
};

// List of IDs to include in generic search
const KNOWN_VACCINE_IDS_VALUES = Object.values(KNOWN_VACCINE_IDS);

// All currently supported AIRV vaccine codes
const KNOWN_AIRV_CODES = {
  COMIRN: 'COMIRN',
  COVAST: 'COVAST',
};

// AIRV: Australian Immunisation Register Vaccine
// This function is used to display the used code
function vaccineIdToAIRVCode(scheduledVaccine) {
  const vaccineId = scheduledVaccine.vaccine.id;
  switch (vaccineId) {
    case KNOWN_VACCINE_IDS.PFIZER:
      return KNOWN_AIRV_CODES.COMIRN;
    case KNOWN_VACCINE_IDS.ASTRAZENECA:
      return KNOWN_AIRV_CODES.COVAST;
    default:
      throw new Error(`Unrecognized vaccine ID ${vaccineId}`);
  }
}

// Dictionary that maps Tamanu injection site to HL7 code
const INJECTION_SITE_TO_HL7_CODE = {
  [INJECTION_SITE_VALUES.RIGHT_ARM]: 'RA',
  [INJECTION_SITE_VALUES.LEFT_ARM]: 'LA',
  [INJECTION_SITE_VALUES.RIGHT_THIGH]: 'RT',
  [INJECTION_SITE_VALUES.LEFT_THIGH]: 'LT',
};

// Returns a reference data ID or an unmatchable string
// This function maps the search value (code) to our internal vaccine ID.
function AIRVCodeToVaccineId(code) {
  switch (code) {
    case KNOWN_AIRV_CODES.COMIRN:
      return KNOWN_VACCINE_IDS.PFIZER;
    case KNOWN_AIRV_CODES.COVAST:
      return KNOWN_VACCINE_IDS.ASTRAZENECA;
    default:
      return 'UNMATCHABLE-STRING-1e79156d-af15-40d9-96e6-ed78d4ce9e1e';
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
          code: INJECTION_SITE_TO_HL7_CODE[injectionSite] || null,
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
      doseNumber: scheduledVaccine.doseLabel,
    },
  };
}

// We only want to return vaccines with codes we know
function getInnerVaccineWhereClause(vaccineCode) {
  // Filtered search
  if (vaccineCode) {
    return { id: AIRVCodeToVaccineId(vaccineCode) };
  }

  // Only include known supported vaccines
  return { id: { [Op.in]: KNOWN_VACCINE_IDS_VALUES } };
}

export function getAdministeredVaccineInclude(_, query) {
  const { patient, 'vaccine-code': vaccineCode } = query;

  return [
    { association: 'recorder', required: true },
    {
      association: 'scheduledVaccine',
      required: true,
      include: [
        {
          association: 'vaccine',
          required: true,
          where: { ...getInnerVaccineWhereClause(vaccineCode) },
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
          ...(patient && { where: { id: FhirReference.parse(patient).id } }),
        },
      ],
    },
  ];
}
