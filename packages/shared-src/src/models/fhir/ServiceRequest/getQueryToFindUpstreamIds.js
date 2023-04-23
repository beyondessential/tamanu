import { Op } from 'sequelize';

export function fromImagingRequests(models, table, id) {
  const {
    ImagingRequest,
    ImagingRequestArea,
    ImagingAreaExternalCode,
    Encounter,
    Facility,
    Location,
    LocationGroup,
    Patient,
    ReferenceData,
    User,
  } = models;

  switch (table) {
    case ImagingRequest.tableName:
      return { where: { id } };
    case ImagingRequestArea.tableName:
      return {
        include: [
          {
            model: ImagingRequestArea,
            as: 'areas',
            where: { id },
          },
        ],
      };
    case Encounter.tableName:
      return {
        include: [
          {
            model: Encounter,
            as: 'encounter',
            where: { id },
          },
        ],
      };
    case Facility.tableName:
      return {
        include: [
          {
            model: Encounter,
            as: 'encounter',
            include: [
              {
                model: Location,
                as: 'location',
                include: [
                  {
                    model: Facility,
                    as: 'facility',
                    where: { id },
                  },
                ],
              },
            ],
          },
        ],
      };
    case Location.tableName:
      return {
        include: [
          {
            model: Encounter,
            as: 'encounter',
            include: [
              {
                model: Location,
                as: 'location',
                where: { id },
              },
            ],
          },
        ],
      };
    case LocationGroup.tableName:
      return {
        include: [
          {
            model: Encounter,
            as: 'encounter',
            include: [
              {
                model: LocationGroup,
                as: 'locationGroup',
                where: { id },
              },
            ],
          },
        ],
      };
    case Patient.tableName:
      return {
        include: [
          {
            model: Encounter,
            as: 'encounter',
            include: [
              {
                model: Patient,
                as: 'patient',
                where: { id },
              },
            ],
          },
        ],
      };
    case ReferenceData.tableName:
      return {
        include: [
          {
            model: ImagingRequestArea,
            as: 'areas',
            include: [
              {
                model: ReferenceData,
                as: 'area',
                where: { id },
              },
            ],
          },
        ],
      };
    case ImagingAreaExternalCode.tableName:
      return {
        include: [
          {
            model: ImagingRequestArea,
            as: 'areas',
            include: [
              {
                model: ReferenceData,
                as: 'area',
                include: [
                  {
                    model: ImagingAreaExternalCode,
                    as: 'imagingAreaExternalCode',
                    where: { id },
                  },
                ],
              },
            ],
          },
        ],
      };
    case User.tableName:
      return {
        include: [
          {
            model: User,
            as: 'requestedBy',
          },
          {
            model: User,
            as: 'completedBy',
          },
        ],
        where: {
          [Op.or]: [{ '$requestedBy.id$': id }, { '$completedBy.id$': id }],
        },
      };
    default:
      return null;
  }
}

export function fromLabRequests(models, table, id) {
  const {
    LabRequest,
    LabTest,
    LabTestType,
    LabTestPanelRequest,
    LabTestPanel,
    NotePage,
    NoteItem,
    Encounter,
    Patient,
    User,
  } = models;

  switch (table) {
    case LabRequest.tableName:
      return { where: { id } };
    case LabTest.tableName:
      return {
        include: [
          {
            model: LabTest,
            as: 'tests',
            where: { id },
          },
        ],
      };
    case LabTestType.tableName:
      return {
        include: [
          {
            model: LabTest,
            as: 'tests',
            include: [
              {
                model: LabTestType,
                as: 'labTestType',
                where: { id },
              },
            ],
          },
        ],
      };
    case LabTestPanelRequest.tableName:
      return {
        include: [
          {
            model: LabTestPanelRequest,
            as: 'labTestPanelRequest',
            where: { id },
          },
        ],
      };
    case LabTestPanel.tableName:
      return {
        include: [
          {
            model: LabTestPanelRequest,
            as: 'labTestPanelRequest',
            include: [
              {
                model: LabTestPanel,
                as: 'labTestPanel',
                where: { id },
              },
            ],
          },
        ],
      };
    case NotePage.tableName:
      return {
        include: [
          {
            model: NotePage,
            as: 'notePages',
            where: { id },
          },
        ],
      };
    case NoteItem.tableName:
      return {
        include: [
          {
            model: NotePage,
            as: 'notePages',
            include: [
              {
                model: NoteItem,
                as: 'noteItems',
                where: { id },
              },
            ],
          },
        ],
      };
    case Encounter.tableName:
      return {
        include: [
          {
            model: Encounter,
            as: 'encounter',
            where: { id },
          },
        ],
      };
    case Patient.tableName:
      return {
        include: [
          {
            model: Encounter,
            as: 'encounter',
            include: [
              {
                model: Patient,
                as: 'patient',
                where: { id },
              },
            ],
          },
        ],
      };
    case User.tableName:
      return {
        include: [
          {
            model: User,
            as: 'requestedBy',
            where: { id },
          },
        ],
      };
    default:
      return null;
  }
}
