import { Sequelize, DataTypes } from 'sequelize';

import { VACCINE_STATUS, INJECTION_SITE_OPTIONS } from 'shared/constants';
import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_TOKEN_TYPES } from 'shared/constants/fhir';
import { FhirResource } from './Resource';
import { arrayOf } from './utils';
import { dateType } from '../dateTimeTypes';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirReference,
  FhirImmunizationPerformer,
  FhirImmunizationProtocolApplied,
} from '../../services/fhirTypes';
import { latestDateTime } from '../../utils/dateTime';

export class FhirImmunization extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: arrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        status: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        vaccineCode: {
          type: DataTypes.FHIR_CODEABLE_CONCEPT,
          allowNull: false,
        },
        patient: {
          type: DataTypes.FHIR_REFERENCE,
          allowNull: false,
        },
        encounter: {
          type: DataTypes.FHIR_REFERENCE,
          allowNull: true,
        },
        occurrenceDateTime: dateType('occuranceDateTime', { allowNull: true }),
        lotNumber: Sequelize.TEXT,
        site: arrayOf('site', DataTypes.FHIR_CODEABLE_CONCEPT),
        performer: arrayOf('performer', DataTypes.FHIR_IMMUNIZATION_PERFORMER),
        protocolApplied: arrayOf('protocolApplied', DataTypes.FHIR_IMMUNIZATION_PROTOCOL_APPLIED),
      },
      options,
    );

    this.UpstreamModel = models.AdministeredVaccine;
  }

  async updateMaterialisation() {
    const { ScheduledVaccine, Encounter, Patient, ReferenceData, User } = this.sequelize.models;

    const administeredVaccine = await this.getUpstream({
      include: [
        {
          model: User,
          as: 'recorder',
        },
        {
          model: ScheduledVaccine,
          as: 'scheduledVaccine',
          include: [
            {
              model: ReferenceData,
              as: 'vaccine',
            },
          ],
        },
        {
          model: Encounter,
          as: 'encounter',
          include: [
            {
              model: Patient,
              as: 'patient',
            },
          ],
        },
      ],
    });

    const { encounter, scheduledVaccine, recorder } = administeredVaccine;
    const { patient } = encounter;

    this.set({
      lastUpdated: latestDateTime(
        administeredVaccine.updatedAt,
        encounter.updatedAt,
        scheduledVaccine.updatedAt,
        recorder.updatedAt,
        scheduledVaccine.vaccine.updatedAt,
        patient.updatedAt,
      ),
      status: status(administeredVaccine.status),
      vaccineCode: vaccineCode(scheduledVaccine),
      patient: patientReference(patient),
      encounter: encounterReference(encounter),
      occurrenceDateTime: administeredVaccine.date,
      lotNumber: administeredVaccine.batch,
      site: site(administeredVaccine.injectionSite),
      performer: performer(recorder),
      protocolApplied: protocolApplied(scheduledVaccine.schedule),
    });
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      patient: {
        type: FHIR_SEARCH_PARAMETERS.REFERENCE,
        path: [['patient']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.STRING,
      },
      'vaccine-code': {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['vaccineCode', '[]']],
      },
    };
  }
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
  return [
    new FhirCodeableConcept({
      ...(code && {
        coding: [
          new FhirCoding({
            system: AIRV_TERMINOLOGY_URL,
            code,
          }),
        ],
      }),
      text: scheduledVaccine.vaccine.name,
    }),
  ];
}

function patientReference(patient) {
  return new FhirReference({
    reference: `Patient/${patient.id}`,
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
  return new FhirImmunizationPerformer({
    actor: new FhirReference({
      reference: `Practitioner/${recorder.id}`,
    }),
  });
}

function protocolApplied(schedule) {
  return new FhirImmunizationProtocolApplied({
    doseNumber: schedule,
  });
}
