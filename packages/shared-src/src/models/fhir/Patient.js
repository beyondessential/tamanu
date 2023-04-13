import config from 'config';
import { Sequelize, DataTypes } from 'sequelize';
import { identity } from 'lodash';

import { FhirResource } from './Resource';
import { activeFromVisibility } from './utils';
import { latestDateTime } from '../../utils/dateTime';
import {
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  FHIR_DATETIME_PRECISION,
  FHIR_INTERACTIONS,
} from '../../constants';
import {
  FhirAddress,
  FhirContactPoint,
  FhirHumanName,
  FhirIdentifier,
  FhirPatientLink,
  FhirReference,
} from '../../services/fhirTypes';
import { nzEthnicity } from './extensions';
import { formatFhirDate } from '../../utils/fhir';

export class FhirPatient extends FhirResource {
  static init(options, models) {
    super.init(
      {
        extension: DataTypes.JSONB,
        identifier: DataTypes.JSONB,
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        name: DataTypes.JSONB,
        telecom: DataTypes.JSONB,
        gender: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        birthDate: DataTypes.TEXT,
        deceasedDateTime: DataTypes.TEXT,
        address: DataTypes.JSONB,
        link: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModel = models.Patient;
    this.upstreams = [models.Patient, models.PatientAdditionalData];
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.INSTANCE.READ,
    FHIR_INTERACTIONS.TYPE.SEARCH,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  ]);

  async updateMaterialisation() {
    const { PatientAdditionalData } = this.sequelize.models;

    const upstream = await this.getUpstream({
      include: [
        {
          model: PatientAdditionalData,
          as: 'additionalData',
          limit: 1,
        },
      ],
    });

    const [first] = upstream.additionalData || [];
    upstream.additionalData = first;

    this.set({
      extension: extension(upstream),
      identifier: identifiers(upstream),
      active: activeFromVisibility(upstream),
      name: names(upstream),
      telecom: telecoms(upstream),
      gender: upstream.sex,
      birthDate: formatFhirDate(upstream.dateOfBirth, FHIR_DATETIME_PRECISION.DAYS),
      deceasedDateTime: formatFhirDate(upstream.dateOfDeath, FHIR_DATETIME_PRECISION.DAYS),
      address: addresses(upstream),
      link: await mergeLinks(upstream),
      lastUpdated: latestDateTime(upstream.updatedAt, upstream.additionalData?.updatedAt),
    });
  }

  async getRelatedUpstreamIds() {
    const upstream = await this.getUpstream();
    const mergedUp = await upstream.getMergedUp();
    const mergedDown = await upstream.getMergedDown();

    return [...mergedUp.map(u => u.id), ...mergedDown.map(u => u.id)];
  }

  static async queryToFindUpstreamIdsFromTable(table, id, deletedRow = null) {
    const { Patient, PatientAdditionalData } = this.sequelize.models;

    switch (table) {
      case Patient.tableName:
        return { where: { id } };
      case PatientAdditionalData.tableName:
        if (deletedRow) {
          return { where: { id: deletedRow.patient_id } };
        }

        return {
          include: [
            {
              model: PatientAdditionalData,
              as: 'additionalData',
              where: { id },
            },
          ],
        };
      default:
        return null;
    }
  }

  asFhir() {
    const resource = super.asFhir();
    // Exclude upstream links if they remain in the materialised data.
    // This can occur if there are records in the Tamanu data that have not been
    // materialised into the FHIR data, but are referred to by the patient links.
    // Although that should not really happen, but it's better to be safe and not
    // expose the upstream link data.
    resource.link = resource.link.filter(link => link.other.type !== 'upstream://patient');
    return resource;
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      identifier: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['identifier', '[]']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
      },
      given: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [['name', '[]', 'given', '[]']],
      },
      family: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [['name', '[]', 'family']],
      },
      gender: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['gender']],
        sortable: false,
        tokenType: FHIR_SEARCH_TOKEN_TYPES.STRING,
      },
      birthdate: {
        type: FHIR_SEARCH_PARAMETERS.DATE,
        path: [['birthDate']],
        datePrecision: FHIR_DATETIME_PRECISION.DAYS,
      },
      address: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [
          ['address', '[]', 'line', '[]'],
          ['address', '[]', 'city'],
          ['address', '[]', 'district'],
          ['address', '[]', 'state'],
          ['address', '[]', 'country'],
          ['address', '[]', 'postal_code'],
          ['address', '[]', 'text'],
        ],
      },
      'address-city': {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [['address', '[]', 'city']],
      },
      telecom: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['telecom', '[]']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
      },
      deceased: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['deceasedDateTime']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.PRESENCE,
      },
      active: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['active']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.BOOLEAN,
      },
      link: {
        type: FHIR_SEARCH_PARAMETERS.REFERENCE,
        path: [['link', '[]', 'other']],
        referenceTypes: ['Patient'],
      },
    };
  }
}

function compactBy(array, access = identity) {
  return array.filter(access);
}

function extension(patient) {
  return [...nzEthnicity(patient)];
}

function identifiers(patient) {
  return compactBy(
    [
      {
        use: 'usual',
        value: patient.displayId,
        assigner: new FhirReference({
          display: config.hl7.assigners.patientDisplayId,
        }),
        system: config.hl7.dataDictionaries.patientDisplayId,
      },
      {
        use: 'secondary',
        assigner: new FhirReference({
          display: config.hl7.assigners.patientPassport,
        }),
        value: patient.additionalData?.passportNumber,
      },
      {
        use: 'secondary',
        assigner: new FhirReference({
          display: config.hl7.assigners.patientDrivingLicense,
        }),
        value: patient.additionalData?.drivingLicense,
      },
    ],
    x => x.value,
  ).map(i => new FhirIdentifier(i));
}

function names(patient) {
  return compactBy([
    {
      use: 'official',
      prefix: compactBy([patient.additionalData?.title]),
      family: patient.lastName,
      given: compactBy([patient.firstName, patient.middleName]),
    },
    patient.culturalName && {
      use: 'nickname',
      text: patient.culturalName,
    },
  ]).map(i => new FhirHumanName(i));
}

function telecoms(patient) {
  return compactBy([
    patient.additionalData?.primaryContactNumber,
    patient.additionalData?.secondaryContactNumber,
  ]).map(
    (value, index) =>
      new FhirContactPoint({
        system: 'phone',
        rank: index + 1,
        value,
      }),
  );
}

function addresses(patient) {
  const { cityTown, streetVillage } = patient.additionalData || {};
  if (!cityTown && !streetVillage) return [];

  return [
    new FhirAddress({
      type: 'physical',
      use: 'home',
      city: cityTown,
      line: compactBy([streetVillage]),
    }),
  ];
}

async function mergeLinks(patient) {
  const links = [];

  // Populates "upstream" links, which must be resolved to FHIR resource links
  // after materialisation by calling FhirResource.resolveUpstreams().

  if (patient.mergedIntoId) {
    const mergeTarget = await patient.getUltimateMergedInto();
    if (mergeTarget) {
      links.push(
        new FhirPatientLink({
          type: 'replaced-by',
          other: new FhirReference({
            reference: mergeTarget.id,
            type: 'upstream://patient',
            display: mergeTarget.displayId,
          }),
        }),
      );
    }
  }

  const down = await patient.getMergedDown();
  for (const mergedPatient of down) {
    if (mergedPatient.mergedIntoId === patient.id) {
      // if it's a merge directly into this patient
      links.push(
        new FhirPatientLink({
          type: 'replaces',
          other: new FhirReference({
            reference: mergedPatient.id,
            type: 'upstream://patient',
            display: mergedPatient.displayId,
          }),
        }),
      );
    } else {
      links.push(
        new FhirPatientLink({
          type: 'seealso',
          other: new FhirReference({
            reference: mergedPatient.id,
            type: 'upstream://patient',
            display: mergedPatient.displayId,
          }),
        }),
      );
    }
  }

  return links;
}
