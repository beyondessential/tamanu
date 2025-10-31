import type { Models } from '../../../types/model';

export function getQueryOptions(models: Models) {
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
        include: [
          {
            model: models.ReferenceData,
            as: 'noteTypeReference',
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
        model: ReferenceData,
        as: 'priority',
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
            include: [
              {
                model: LabTestType,
                as: 'labTestTypes',
              },
            ],
          },
        ],
      },
      {
        model: Note,
        as: 'notes',
        include: [
          {
            model: models.ReferenceData,
            as: 'noteTypeReference',
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
