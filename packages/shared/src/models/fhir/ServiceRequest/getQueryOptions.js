export function getQueryOptions(models) {
  const {
    Encounter,
    Facility,
    Location,
    LocationGroup,
    Patient,
    ReferenceData,
    User,
    ImagingRequest,
    LabRequest,
    LabTest,
    LabTestType,
    LabPanelRequest,
    LabPanel,
    Note,
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
      {
        model: LocationGroup,
        as: 'locationGroup',
        include: [
          {
            model: Facility,
            as: 'facility',
          },
        ],
      },
      {
        model: Note,
        as: 'notes',
      },
    ],
  };

  const labRequestOptions = {
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
        ],
      },
      {
        model: LabTest,
        as: 'tests',
        include: [
          {
            model: LabTestType,
            as: 'labTestType',
          },
        ],
      },
      {
        model: LabPanelRequest,
        as: 'labPanelRequest',
        include: [
          {
            model: LabPanel,
            as: 'labPanel',
          },
        ],
      },
      {
        model: Note,
        as: 'notes',
      },
    ],
  };

  return {
    [ImagingRequest.tableName]: imagingRequestOptions,
    [LabRequest.tableName]: labRequestOptions,
  };
}
