import { Op } from 'sequelize';

export function getQueryToFindUpstreamIds(models, upstreamTable, table, id) {
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

  if (upstreamTable !== ImagingRequest.tableName) return null;

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
