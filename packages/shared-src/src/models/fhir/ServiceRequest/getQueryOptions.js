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
    LabTestPanelRequest,
    LabTestPanel,
    NotePage,
    NoteItem,
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
      },
      {
        model: NotePage,
        as: 'notePages',
        include: [
          {
            model: NoteItem,
            as: 'noteItems',
          },
        ],
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
        model: LabTestPanelRequest,
        as: 'labTestPanelRequest',
        include: [
          {
            model: LabTestPanel,
            as: 'labTestPanel',
          },
        ],
      },
      {
        model: NotePage,
        as: 'notePages',
        include: [
          {
            model: NoteItem,
            as: 'noteItems',
          },
        ],
      },
    ],
  };

  return {
    [ImagingRequest.tableName]: imagingRequestOptions,
    [LabRequest.tableName]: labRequestOptions,
  };
}
