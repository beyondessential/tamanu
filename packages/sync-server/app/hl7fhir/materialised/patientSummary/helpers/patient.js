import { FHIR_RESOURCE_TYPES } from '@tamanu/constants';

export const getHl7Patient = async ({ patient = {}, models }) => {
  const {
    title: patientTitle,
    cityTown,
    streetVillage,
    primaryContactNumber,
    secondaryContactNumber,
  } =
    (await models.PatientAdditionalData.findOne({
      where: {
        patientId: patient.id,
      },
    })) || {};

  return {
    id: patient.id,
    resourceType: FHIR_RESOURCE_TYPES.PATIENT,
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the details for ${patient.displayName}. Please review the data for more detail.</div>`,
    },
    identifier: [
      {
        use: 'usual',
        value: patient.displayId,
        system: 'http://data-dictionary.tamanu-fiji.org/application-reference-number.html',
      },
      {
        use: 'official',
        value: patient.displayId,
      },
      {
        use: 'secondary',
        value: patient.displayId,
      },
    ],
    name: [
      {
        use: 'official',
        ...(patientTitle && { prefix: patientTitle }),
        family: patient.lastName,
        given: [patient.firstName, ...(patient.middleName ? [patient.middleName] : [])],
      },
      ...(patient.culturalName
        ? [
            {
              use: 'nickname',
              text: patient.culturalName,
            },
          ]
        : []),
    ],
    gender: patient.sex,
    ...((cityTown || streetVillage) && {
      address: [
        {
          type: 'physical',
          use: 'home',
          ...(cityTown && { city: cityTown }),
          ...(streetVillage && { line: streetVillage }),
        },
      ],
    }),
    ...((primaryContactNumber || secondaryContactNumber) && {
      telecom: [
        ...(primaryContactNumber
          ? [
              {
                system: 'phone',
                rank: 1,
                value: primaryContactNumber,
              },
            ]
          : []),
        ...(secondaryContactNumber
          ? [
              {
                system: 'phone',
                rank: 2,
                value: secondaryContactNumber,
              },
            ]
          : []),
      ],
    }),
    birthDate: patient.dateOfBirth,
    ...(patient.dateOfDeath && { deceasedDateTime: patient.dateOfDeath }),
  };
};
