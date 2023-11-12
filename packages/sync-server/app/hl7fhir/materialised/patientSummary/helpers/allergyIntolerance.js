import { v4 as uuidv4 } from 'uuid';
import { FHIR_RESOURCE_TYPES } from '@tamanu/constants';

import { getEntryResourceSubject, getPatientDisplayName } from '../utils';

export const getAllergyIntolerances = async ({ patient, models, dataDictionariesIps }) => {
  const patientAllergies = await models.PatientAllergy.findAll({
    where: {
      patientId: patient.id,
    },
    include: ['allergy'],
  });

  const allergyIntolerancesHeader = {
    resourceType: FHIR_RESOURCE_TYPES.ALLERGY_INTOLERANCE,
    patient: getEntryResourceSubject(patient),
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: 'active',
        },
      ],
    },
  };

  if (!patientAllergies?.length) {
    const allergyCodingDisplay = 'No known allergies';
    return [
      {
        id: uuidv4(),
        ...allergyIntolerancesHeader,
        code: {
          coding: [
            {
              system: dataDictionariesIps.absentUnknown,
              code: 'no-known-allergies',
              display: allergyCodingDisplay,
            },
          ],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Allergy Intolerance details for ${getPatientDisplayName(
            patient,
          )} for ${allergyCodingDisplay}. Please review the data for more detail.</div>`,
        },
      },
    ];
  }

  return patientAllergies.map(patientAllergy => ({
    id: uuidv4(),
    ...allergyIntolerancesHeader,
    code: {
      coding: [
        {
          system: dataDictionariesIps.allergyIntoleranceEncoding,
          code: patientAllergy.allergy.code,
          display: patientAllergy.allergy.name,
        },
      ],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Allergy Intolerance details for ${getPatientDisplayName(
        patient,
      )} for ${patientAllergy.allergy.name}. Please review the data for more detail.</div>`,
    },
  }));
};
