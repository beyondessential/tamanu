export function getQueryOptions(models) {
  const {
    Encounter,
    Facility,
    Location,
    Patient,
    ReferenceData,
    User,
    ImagingRequest,
    LabRequest,
  } = models;

  const imagingRequestOptions = {
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

  const labRequestOptions = {};

  return {
    [ImagingRequest.tableName]: imagingRequestOptions,
    [LabRequest.tableName]: labRequestOptions,
  };
}
