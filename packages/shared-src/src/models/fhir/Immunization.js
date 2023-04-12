import { Sequelize, DataTypes } from 'sequelize';

import { VACCINE_STATUS, INJECTION_SITE_OPTIONS } from 'shared/constants';
import {
  FHIR_INTERACTIONS,
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
} from 'shared/constants/fhir';

import { FhirResource } from './Resource';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirReference,
  FhirImmunizationPerformer,
  FhirImmunizationProtocolApplied,
} from '../../services/fhirTypes';
import { latestDateTime } from '../../utils/dateTime';
import { formatFhirDate } from '../../utils/fhir';

export class FhirImmunization extends FhirResource {
  static init(options, models) {
    super.init(
      {
        status: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        vaccineCode: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        patient: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        encounter: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        occurrenceDateTime: Sequelize.TEXT,
        lotNumber: Sequelize.TEXT,
        site: DataTypes.JSONB,
        performer: DataTypes.JSONB,
        protocolApplied: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModel = models.AdministeredVaccine;
    this.upstreams = [
      models.AdministeredVaccine,
      models.Encounter,
      models.Patient,
      models.ReferenceData,
      models.ScheduledVaccine,
      models.User,
    ];
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.INSTANCE.READ,
    FHIR_INTERACTIONS.TYPE.SEARCH,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  ]);

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
        administeredVaccine?.updatedAt,
        encounter?.updatedAt,
        scheduledVaccine?.updatedAt,
        recorder?.updatedAt,
        scheduledVaccine?.vaccine?.updatedAt,
        patient?.updatedAt,
      ),
      status: status(administeredVaccine.status),
      vaccineCode: vaccineCode(scheduledVaccine),
      patient: patientReference(patient),
      encounter: encounterReference(encounter),
      occurrenceDateTime: formatFhirDate(administeredVaccine.date),
      lotNumber: administeredVaccine.batch,
      site: site(administeredVaccine.injectionSite),
      performer: performer(recorder),
      protocolApplied: protocolApplied(scheduledVaccine.schedule),
    });
  }

  static async queryToFindUpstreamIdsFromTable(table, id) {
    const {
      AdministeredVaccine,
      Encounter,
      Patient,
      ReferenceData,
      ScheduledVaccine,
      User,
    } = this.sequelize.models;

    switch (table) {
      case AdministeredVaccine.tableName:
        return { where: { id } };
      case Encounter.tableName:
        return {
          include: [
            {
              model: Encounter,
              as: 'encounter',
              where: { id },
            },
          ],
        };
      case Patient.tableName:
        return {
          include: [
            {
              model: Encounter,
              as: 'encounter',
              include: [
                {
                  model: Patient,
                  as: 'patient',
                  where: { id },
                },
              ],
            },
          ],
        };
      case ReferenceData.tableName:
        return {
          include: [
            {
              model: ScheduledVaccine,
              as: 'scheduledVaccine',
              include: [
                {
                  model: ReferenceData,
                  as: 'vaccine',
                  where: { id },
                },
              ],
            },
          ],
        };
      case ScheduledVaccine.tableName:
        return {
          include: [
            {
              model: ScheduledVaccine,
              as: 'scheduledVaccine',
              where: { id },
            },
          ],
        };
      case User.tableName:
        return {
          include: [
            {
              model: User,
              as: 'recorder',
              where: { id },
            },
          ],
        };
      default:
        return null;
    }
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      patient: {
        type: FHIR_SEARCH_PARAMETERS.REFERENCE,
        path: [['patient']],
      },
      'vaccine-code': {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['vaccineCode', 'coding', '[]']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.CODING,
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
