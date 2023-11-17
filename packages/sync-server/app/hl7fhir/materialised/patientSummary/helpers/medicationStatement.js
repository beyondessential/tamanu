import { v4 as uuidv4 } from 'uuid';
import { FHIR_RESOURCE_TYPES } from '@tamanu/constants';

import { getEntryResourceSubject } from '../utils';

export const getMedicationStatements = async ({ patient, models, dataDictionariesIps }) => {
  const openEncounter = await models.Encounter.findOne({
    where: {
      patientId: patient.id,
      endDate: null,
    },
  });

  const encounterMedications = openEncounter
    ? await models.EncounterMedication.findAll({
        where: {
          encounterId: openEncounter.id,
        },
        include: ['Medication'],
      })
    : [];

  const medicationStatementsHeader = {
    resourceType: FHIR_RESOURCE_TYPES.MEDICATION_STATEMENT,
    status: openEncounter ? 'active' : 'unknown',
    subject: getEntryResourceSubject(patient),
  };

  if (!encounterMedications?.length) {
    const encounterMedicationDisplay = 'No information about medications';
    return [
      {
        id: uuidv4(),
        ...medicationStatementsHeader,
        medicationCodeableConcept: {
          coding: [
            {
              system: dataDictionariesIps.absentUnknown,
              code: 'no-medication-info',
              display: encounterMedicationDisplay,
            },
          ],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Medication Statement details for ${patient.displayName} for ${encounterMedicationDisplay}. Please review the data for more detail.</div>`,
        },
      },
    ];
  }

  return encounterMedications.map(encounterMedication => ({
    id: uuidv4(),
    ...medicationStatementsHeader,
    medicationCodeableConcept: {
      coding: [
        {
          system: dataDictionariesIps.medicationEncoding,
          code: encounterMedication.Medication.code,
          display: encounterMedication.Medication.name,
        },
      ],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Medication Statement details for ${patient.displayName} for ${encounterMedication.Medication.name}. Please review the data for more detail.</div>`,
    },
    effectivePeriod: {
      start: encounterMedication.date,
    },
    dosage: [
      {
        timing: {
          repeat: {
            when: 'MORN',
          },
        },
        doseAndRate: [
          {
            value: encounterMedication.qtyMorning,
          },
        ],
        route: encounterMedication.route,
      },
      {
        timing: {
          repeat: {
            when: 'CD',
          },
        },
        doseAndRate: [
          {
            value: encounterMedication.qtyLunch,
          },
        ],
      },
      {
        timing: {
          repeat: {
            when: 'EVE',
          },
        },
        doseAndRate: [
          {
            value: encounterMedication.qtyEvening,
          },
        ],
      },
      {
        timing: {
          repeat: {
            when: 'NIGHT',
          },
        },
        doseAndRate: [
          {
            value: encounterMedication.qtyNight,
          },
        ],
      },
    ],
  }));
};
