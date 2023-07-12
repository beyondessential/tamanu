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
            required: true,
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
            required: true,
            include: [
              {
                model: Location,
                as: 'location',
                required: true,
                include: [
                  {
                    model: Facility,
                    as: 'facility',
                    required: true,
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
            required: true,
            include: [
              {
                model: Location,
                as: 'location',
                required: true,
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
            model: LocationGroup,
            as: 'locationGroup',
            required: true,
            where: { id },
          },
        ],
      };
    case ReferenceData.tableName:
      return {
        include: [
          {
            model: ImagingRequestArea,
            required: true,
            include: [
              {
                model: ReferenceData,
                as: 'area',
                required: true,
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
            required: true,
            include: [
              {
                model: ReferenceData,
                as: 'area',
                required: true,
                include: [
                  {
                    model: ImagingAreaExternalCode,
                    as: 'imagingAreaExternalCode',
                    required: true,
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
            required: true,
          },
          {
            model: User,
            as: 'completedBy',
            required: true,
          },
        ],
        where: {
          [Op.or]: [{ '$requestedBy.id$': id }, { '$completedBy.id$': id }],
        },
      };
    default:
      return fromBoth(models, table, id);
  }
}

export function fromLabRequests(models, table, id) {
  const { LabRequest, LabTest, LabTestType, LabPanelRequest, LabPanel, User } = models;

  switch (table) {
    case LabRequest.tableName:
      return { where: { id } };
    case LabTest.tableName:
      return {
        include: [
          {
            model: LabTest,
            as: 'tests',
            required: true,
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
            required: true,
            include: [
              {
                model: LabTestType,
                as: 'labTestType',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };
    case LabPanelRequest.tableName:
      return {
        include: [
          {
            model: LabPanelRequest,
            as: 'labPanelRequest',
            required: true,
            where: { id },
          },
        ],
      };
    case LabPanel.tableName:
      return {
        include: [
          {
            model: LabPanelRequest,
            as: 'labPanelRequest',
            required: true,
            include: [
              {
                model: LabPanel,
                as: 'labPanel',
                required: true,
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
            required: true,
            where: { id },
          },
        ],
      };
    default:
      return fromBoth(models, table, id);
  }
}

function fromBoth(models, table, id) {
  const { NotePage, NoteItem, Encounter, Patient } = models;

  switch (table) {
    case NotePage.tableName:
      return {
        include: [
          {
            model: NotePage,
            as: 'notePages',
            required: true,
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
            required: true,
            include: [
              {
                model: NoteItem,
                as: 'noteItems',
                required: true,
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
            required: true,
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
            required: true,
            include: [
              {
                model: Patient,
                as: 'patient',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };
    default:
      return null;
  }
}
