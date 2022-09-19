import config from 'config';
import { Sequelize, DataTypes } from 'sequelize';

import { FhirResource } from './Resource';
import { dateType } from '../dateTimeTypes';
import { latestDateTime } from '../../utils/dateTime';
import { VISIBILITY_STATUSES } from '../../constants';
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
        identifier: this.ArrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        name: this.ArrayOf('name', DataTypes.FHIR_HUMAN_NAME),
        telecom: this.ArrayOf('telecom', DataTypes.FHIR_CONTACT_POINT),
        gender: {
          type: Sequelize.STRING(10),
          allowNull: false,
        },
        birthDate: dateType('birthDate', { allowNull: true }),
        deceasedDateTime: dateType('deceasedDateTime', { allowNull: true }),
        address: this.ArrayOf('address', DataTypes.FHIR_ADDRESS),
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

    upstream.additionalData = (upstream.additionalData || [])[0];

    this.set({
      identifier: identifiers(upstream),
      active: upstream.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
      name: names(upstream),
      telecom: telecoms(upstream),
      gender: upstream.sex,
      birthDate: upstream.dateOfBirth,
      deceasedDateTime: upstream.dateOfDeath,
      address: addresses(upstream),
      lastUpdated: latestDateTime(upstream.updatedAt, upstream.additionalData.updatedAt),
    });
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
        assigner: 'Fiji Passport Office',
        value: patient.additionalData.passportNumber,
      },
      {
        use: 'secondary',
        assigner: 'RTA',
        value: patient.additionalData.drivingLicense,
      },
    ],
    x => x.value,
  ).map(i => new FhirIdentifier(i));
}

function names(patient) {
  return compact([
    new FhirHumanName({
      use: 'official',
      prefix: compact([patient.additionalData.title]),
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
    patient.additionalData.primaryContactNumber,
    patient.additionalData.secondaryContactNumber,
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
  const { cityTown, streetVillage } = patient.additionalData;
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
