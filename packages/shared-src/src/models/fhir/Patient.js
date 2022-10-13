import config from 'config';
import { Sequelize, DataTypes } from 'sequelize';
import { identity } from 'lodash';

import { FhirResource } from './Resource';
import { arrayOf, activeFromVisibility } from './utils';
import { dateType } from '../dateTimeTypes';
import { latestDateTime } from '../../utils/dateTime';
import {
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  FHIR_DATETIME_PRECISION,
} from '../../constants';
import {
  FhirAddress,
  FhirContactPoint,
  FhirHumanName,
  FhirIdentifier,
  FhirPatientLink,
  FhirReference,
} from '../../services/fhirTypes';

export class FhirPatient extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: arrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        name: arrayOf('name', DataTypes.FHIR_HUMAN_NAME),
        telecom: arrayOf('telecom', DataTypes.FHIR_CONTACT_POINT),
        gender: {
          type: Sequelize.STRING(10),
          allowNull: false,
        },
        birthDate: dateType('birthDate', { allowNull: true }),
        deceasedDateTime: dateType('deceasedDateTime', { allowNull: true }),
        address: arrayOf('address', DataTypes.FHIR_ADDRESS),
        link: arrayOf('link', DataTypes.FHIR_PATIENT_LINK),
      },
      options,
    );

    this.UpstreamModel = models.Patient;
  }

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
      identifier: identifiers(upstream),
      active: activeFromVisibility(upstream),
      name: names(upstream),
      telecom: telecoms(upstream),
      gender: upstream.sex,
      birthDate: upstream.dateOfBirth,
      deceasedDateTime: upstream.dateOfDeath,
      address: addresses(upstream),
      link: await mergeLinks(upstream),
      lastUpdated: latestDateTime(upstream.updatedAt, upstream.additionalData?.updatedAt),
    });
  }

  static async resolveUpstreamLinks() {
    await this.sequelize.query('CALL fhir.patients_resolve_upstream_links()');
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
    };
  }
}

function compactBy(array, access = identity) {
  return array.filter(access);
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
  // after materialisation by calling FhirPatient.resolveUpstreamLinks().

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
      links.push(new FhirPatientLink({
        type: 'replaces',
        other: new FhirReference({
          reference: mergedPatient.id,
          type: 'upstream://patient',
          display: mergedPatient.displayId,
        })
      }));
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
