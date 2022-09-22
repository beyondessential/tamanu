import config from 'config';
import { Sequelize, DataTypes } from 'sequelize';
import { string } from 'yup';

import { FhirResource } from './Resource';
import { arrayOf, activeFromVisibility } from './utils';
import { dateType } from '../dateTimeTypes';
import { latestDateTime } from '../../utils/dateTime';
import { FHIR_SEARCH_PARAMETERS } from '../../constants';
import {
  FhirAddress,
  FhirContactPoint,
  FhirHumanName,
  FhirIdentifier,
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
      active: activeFromVisibility(upstream.visibilityStatus),
      name: names(upstream),
      telecom: telecoms(upstream),
      gender: upstream.sex,
      birthDate: upstream.dateOfBirth,
      deceasedDateTime: upstream.dateOfDeath,
      address: addresses(upstream),
      lastUpdated: latestDateTime(upstream.updatedAt, upstream.additionalData?.updatedAt),
    });
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      identifier: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['identifier', '[]']],
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
        parameterSchema: yup => yup.shape({
          code: string().oneOf(['female', 'male', 'other']).required(),
        }),
        sortable: false,
      },
      birthdate: {
        type: FHIR_SEARCH_PARAMETERS.DATE,
        path: [['birthDate']],
      },
      address: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [
          // ['address', '[]', 'line', '[]'], // TODO
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
      },
      deceased: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: ['deceasedDateTime'],
        getOperator: value => (value ? Op.not : Op.is),
      },
      active: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: ['active'],
      },
    };
  }
}

function compact(array, access = a => a) {
  return array.filter(access);
}

function identifiers(patient) {
  return compact(
    [
      {
        use: 'usual',
        value: patient.displayId,
        assigner: config.hl7.assigners.patientDisplayId,
        system: config.hl7.dataDictionaries.patientDisplayId,
      },
      {
        use: 'secondary',
        assigner: config.hl7.assigners.patientPassport,
        value: patient.additionalData?.passportNumber,
      },
      {
        use: 'secondary',
        assigner: config.hl7.assigners.patientDrivingLicense,
        value: patient.additionalData?.drivingLicense,
      },
    ],
    x => x.value,
  ).map(i => new FhirIdentifier(i));
}

function names(patient) {
  return compact([
    new FhirHumanName({
      use: 'official',
      prefix: compact([patient.additionalData?.title]),
      family: patient.lastName,
      given: compact([patient.firstName, patient.middleName]),
    }),
    patient.culturalName &&
      new FhirHumanName({
        use: 'nickname',
        text: patient.culturalName,
      }),
  ]);
}

function telecoms(patient) {
  return compact([
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
      line: compact([streetVillage]),
    }),
  ];
}
