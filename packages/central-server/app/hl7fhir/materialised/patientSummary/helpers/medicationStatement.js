import { v4 as uuidv4 } from 'uuid';
import { FHIR_RESOURCE_TYPES } from '@tamanu/constants';

import { formatFhirDate } from '@tamanu/shared/utils/fhir';
import { getEntryResourceSubject } from '../utils';

export const getMedicationStatements = async ({ patient, models, dataDictionariesIps }) => {
  const openEncounter = await models.Encounter.findOne({
    where: {
      patientId: patient.id,
      endDate: null,
    },
  });

  const prescriptions = openEncounter
  ? await models.Prescription.findAll({
      include: [
        {
          model: models.Encounter,
          through: { model: models.EncounterPrescriptions },
          where: { id: openEncounter.id },
        },
        'Medication',
      ],
    })
  : [];

  const medicationStatementsHeader = {
    resourceType: FHIR_RESOURCE_TYPES.MEDICATION_STATEMENT,
    status: openEncounter ? 'active' : 'unknown',
    subject: getEntryResourceSubject(patient),
  };

  if (!prescriptions?.length) {
    const prescriptionDisplay = 'No information about medications';
    return [
      {
        id: uuidv4(),
        ...medicationStatementsHeader,
        medicationCodeableConcept: {
          coding: [
            {
              system: dataDictionariesIps.absentUnknown,
              code: 'no-medication-info',
              display: prescriptionDisplay,
            },
          ],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Medication Statement details for ${patient.displayName} for ${prescriptionDisplay}. Please review the data for more detail.</div>`,
        },
      },
    ];
  }

  return prescriptions.map(prescription => ({
    id: uuidv4(),
    ...medicationStatementsHeader,
    medicationCodeableConcept: {
      coding: [
        {
          system: dataDictionariesIps.medicationEncoding,
          code: prescription.Medication.code,
          display: prescription.Medication.name,
        },
      ],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Medication Statement details for ${patient.displayName} for ${prescription.Medication.name}. Please review the data for more detail.</div>`,
    },
    effectivePeriod: {
      start: formatFhirDate(prescription.date),
    },
    dosage: [
      {
        timing: {
          repeat: {
            when: ['MORN'],
          },
        },
        doseAndRate: [
          {
            doseQuantity: { value: prescription.qtyMorning },
          },
        ],
        route: { text: prescription.route },
      },
      {
        timing: {
          repeat: {
            when: ['CD'],
          },
        },
        doseAndRate: [
          {
            doseQuantity: { value: prescription.qtyLunch },
          },
        ],
      },
      {
        timing: {
          repeat: {
            when: ['EVE'],
          },
        },
        doseAndRate: [
          {
            doseQuantity: { value: prescription.qtyEvening },
          },
        ],
      },
      {
        timing: {
          repeat: {
            when: ['NIGHT'],
          },
        },
        doseAndRate: [
          {
            doseQuantity: { value: prescription.qtyNight },
          },
        ],
      },
    ],
  }));
};
