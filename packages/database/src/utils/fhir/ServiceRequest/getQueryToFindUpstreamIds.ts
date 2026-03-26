import { Op } from 'sequelize';
import type { Models } from '../../../types/model';

export function fromImagingRequests(models: Models, table: string, id: string) {
  const {
    ImagingRequest,
    ImagingRequestArea,
    ImagingAreaExternalCode,
    ImagingTypeExternalCode,
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
    case ImagingTypeExternalCode.tableName:
      return {
        include: [
          {
            model: ImagingTypeExternalCode,
            as: 'imagingTypeExternalCode',
            required: true,
            where: { id },
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
          [Op.or as symbol]: [{ '$requestedBy.id$': id }, { '$completedBy.id$': id }],
        },
      };
    default:
      return fromBoth(models, table, id);
  }
}

export function fromLabRequests(models: Models, table: string, id: string) {
  const { LabRequest, LabTest, LabTestType, LabTestPanelRequest, LabTestPanel, User } = models;

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
    case LabTestPanelRequest.tableName:
      return {
        include: [
          {
            model: LabTestPanelRequest,
            as: 'labTestPanelRequest',
            required: true,
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
            required: true,
            include: [
              {
                model: LabTestPanel,
                as: 'labTestPanel',
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

function fromBoth(models: Models, table: string, id: string) {
  const { Note, Encounter, Patient } = models;

  switch (table) {
    case Note.tableName:
      return {
        include: [
          {
            model: Note,
            as: 'notes',
            required: true,
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
