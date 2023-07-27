export function getQueryOptions(models) {
  const { Encounter, Discharge, Patient, Location, LocationGroup } = models;

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
      ],
    },
  };
}
