import { v4 as uuidv4 } from 'uuid';
import { FHIR_RESOURCE_TYPES } from '@tamanu/constants';
import { formatFhirDate } from '@tamanu/shared/utils/fhir';

import { getEntryResourceSubject } from '../utils';
import { administeredVaccineStatusToHL7Status } from '../../../administeredVaccine';

export const getImmunizations = async ({ patient, models, dataDictionariesIps }) => {
  const administeredVaccines = await models.AdministeredVaccine.findAll({
    where: {
      '$encounter.patient_id$': patient.id,
    },
    include: [
      {
        model: models.ScheduledVaccine,
        as: 'scheduledVaccine',
        include: ['vaccine'],
      },
      {
        model: models.Encounter,
        as: 'encounter',
      },
    ],
  });

  const administeredVaccinesHeader = {
    resourceType: FHIR_RESOURCE_TYPES.IMMUNIZATION,
    patient: getEntryResourceSubject(patient),
  };

  if (!administeredVaccines?.length) {
    const immunizationCodingDisplay = 'No information about immunizations';
    return [
      {
        id: uuidv4(),
        ...administeredVaccinesHeader,
        vaccineCode: {
          coding: [
            {
              system: dataDictionariesIps.absentUnknown,
              code: 'no-immunization-info',
              display: immunizationCodingDisplay,
            },
          ],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Immunizations for ${patient.displayName} for ${immunizationCodingDisplay}. Please review the data for more detail.</div>`,
        },
      },
    ];
  }

  return administeredVaccines.map(administeredVaccine => ({
    id: uuidv4(),
    ...administeredVaccinesHeader,
    vaccineCode: {
      coding: [
        {
          system: dataDictionariesIps.immunizationEncoding,
          code: administeredVaccine.scheduledVaccine.vaccine.code,
          display: administeredVaccine.scheduledVaccine.vaccine.name,
        },
      ],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">These are the Immunization details for ${patient.displayName} for ${administeredVaccine.scheduledVaccine.vaccine.name}. Please review the data for more detail.</div>`,
    },
    status: administeredVaccineStatusToHL7Status(administeredVaccine.status),
    ...(administeredVaccine.date
      ? {
          occurrenceDateTime: formatFhirDate(administeredVaccine.date),
        }
      : {
          occurrenceString: 'unknown',
        }),
  }));
};
