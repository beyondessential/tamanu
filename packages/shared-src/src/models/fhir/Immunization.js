import { Sequelize, DataTypes } from 'sequelize';

import { VACCINE_STATUS, INJECTION_SITE_OPTIONS } from 'shared/constants';
import { FhirResource } from './Resource';
import { arrayOf } from './utils';
import { dateType } from '../dateTimeTypes';
import { FhirCodeableConcept, FhirCoding } from '../../services/fhirTypes';

export class FhirImmunization extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: arrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        status: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        vaccineCode: arrayOf('vaccineCode', DataTypes.FHIR_CODEABLE_CONCEPT),
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
        protocolApplied: arrayOf('performer', DataTypes.FHIR_IMMUNIZATION_PROTOCOL_APPLIED),
      },
      options,
    );

    this.UpstreamModel = models.AdministeredVaccine;
  }

  async updateMaterialisation() {
    const { ScheduledVaccine, Encounter, Patient, ReferenceData } = this.sequelize.models;

    const administeredVaccine = await this.getUpstream({
      include: [
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

    const { encounter, scheduledVaccine } = administeredVaccine;
    const { patient } = encounter;

    this.set({
      status: status(administeredVaccine.status),
      vaccineCode: vaccineCode(scheduledVaccine),
      patient: patient.id,
      encounter: encounter.id,
      occurrenceDateTime: administeredVaccine.date,
      lotNumber: administeredVaccine.batch,
      site: site(administeredVaccine.injectionSite),
      performer: performer(administeredVaccine.recorder),
      protocolApplied: protocolApplied(scheduledVaccine.schedule),
    });
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

  // TODO: We don't want to save unsupported vaccine codes, do we?
  if (code === null) {
    return []; // TODO: Should this be [{}] ?
  }

  return [
    new FhirCodeableConcept({
      coding: [
        new FhirCoding({
          system: AIRV_TERMINOLOGY_URL,
          code,
        }),
      ],
    }),
  ];
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
  return null; // TODO: figure out what to save here
}

function protocolApplied(schedule) {
  return null; // TODO: figure out what to save here
}
