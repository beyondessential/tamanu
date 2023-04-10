export function getQueryOptions(models) {
  const { Encounter, Facility, Location, Patient, ReferenceData, User } = models;

  return {
    include: [
      {
        model: User,
        as: 'requestedBy',
      },
      {
        model: Encounter,
        as: 'encounter',
        include: [
          {
            model: Patient,
            as: 'patient',
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
      {
        model: ReferenceData,
        as: 'areas',
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
  };
}
