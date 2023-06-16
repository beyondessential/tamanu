export function getQueryOptions(models) {
  const { ScheduledVaccine, Encounter, Patient, ReferenceData, User, AdministeredVaccine } = models;

  const administeredVaccineOptions = {
    include: [
      {
        model: User,
        as: 'recorder',
      },
      {
        model: ScheduledVaccine,
        as: 'scheduledVaccine',
        include: [
          {
            model: ReferenceData,
            as: 'vaccine',
          },
        ],
      },
      {
        model: Encounter,
        as: 'encounter',
        include: [
          {
            model: Patient,
            as: 'patient',
          },
        ],
      },
    ],
  };

  return {
    [AdministeredVaccine.tableName]: administeredVaccineOptions,
  };
}
