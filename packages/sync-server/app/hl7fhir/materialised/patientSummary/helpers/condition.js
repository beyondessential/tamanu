import { v4 as uuidv4 } from 'uuid';
import { FHIR_RESOURCE_TYPES } from '@tamanu/constants';

import { getEntryResourceSubject, getPatientDisplayName } from '../utils';

export const getConditions = async ({ patient, models, dataDictionariesIps }) => {
  const patientConditions = await models.PatientCondition.findAll({
    where: {
      patientId: patient.id,
    },
    include: ['condition'],
  });

  const clinicalStatusObject = (condition = {}) => ({
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: condition.resolved ? 'resolved' : 'active',
      },
    ],
  });

  const patientConditionsHeader = {
    resourceType: FHIR_RESOURCE_TYPES.CONDITION,
    subject: getEntryResourceSubject(patient),
    clinicalStatus: clinicalStatusObject(),
  };

  if (!patientConditions?.length) {
    const conditionCodingDisplay = 'No information about problems';
    return [
      {
        id: uuidv4(),
        ...patientConditionsHeader,
        clinicalStatus: clinicalStatusObject(),
        code: {
          coding: [
            {
              system: dataDictionariesIps.absentUnknown,
              code: 'no-problem-info',
              display: conditionCodingDisplay,
            },
          ],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Condition details for ${getPatientDisplayName(
            patient,
          )} for ${conditionCodingDisplay}. Please review the data for more detail.</div>`,
        },
      },
    ];
  }

  return patientConditions.map(patientCondition => ({
    id: uuidv4(),
    ...patientConditionsHeader,
    clinicalStatus: clinicalStatusObject(patientCondition),
    code: {
      coding: [
        {
          system: dataDictionariesIps.conditionEncoding,
          code: patientCondition.condition.code,
          display: patientCondition.condition.name,
        },
      ],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Condition details for ${getPatientDisplayName(
        patient,
      )} for ${patientCondition.condition.name}. Please review the data for more detail.</div>`,
    },
    onsetPeriod: {
      end: patientCondition.resolutionDate,
    },
  }));
};
