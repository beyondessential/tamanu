import type { Models } from '../../../types/model';

export function getQueryOptions(models: Models) {
  const { Encounter, Discharge, Patient, Facility, Location, LocationGroup } = models;

  return {
    [Encounter.tableName]: {
      include: [
        {
          model: Discharge,
          as: 'discharge',
          required: false,
        },
        {
          model: Patient,
          as: 'patient',
        },
        {
          model: Location,
          as: 'location',
          include: [
            {
              model: LocationGroup,
              as: 'locationGroup',
            },
          ],
        },
        {
          model: Location,
          as: 'location',
          include: [
            {
              model: Facility,
              as: 'facility',
            },
          ],
        },
      ],
    },
  };
}
