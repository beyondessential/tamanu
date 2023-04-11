import { DataTypes, Op } from 'sequelize';

import { FhirResource } from '../Resource';

import {
  FHIR_INTERACTIONS,
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
} from '../../../constants';
import { getQueryOptions } from './getQueryOptions';
import { getValues } from './getValues';

export class FhirServiceRequest extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: DataTypes.JSONB,
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        intent: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        category: DataTypes.JSONB,
        priority: DataTypes.TEXT,
        code: DataTypes.JSONB,
        orderDetail: DataTypes.JSONB,
        subject: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        occurrenceDateTime: DataTypes.TEXT,
        requester: DataTypes.JSONB,
        locationCode: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.ImagingRequest, models.LabRequest];
    this.upstreams = [
      models.ImagingRequest,
      models.ImagingRequestArea,
      models.ImagingAreaExternalCode,
      models.Encounter,
      models.Facility,
      models.Location,
      models.LocationGroup,
      models.Patient,
      models.ReferenceData,
      models.User,
    ];
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.INSTANCE.READ,
    FHIR_INTERACTIONS.TYPE.SEARCH,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  ]);

  async updateMaterialisation() {
    const upstream = await this.getUpstream(getQueryOptions(this.sequelize.models));
    const values = await getValues(upstream, this.sequelize.models);
    this.set(values);
  }

  static async queryToFindUpstreamIdsFromTable(table, id) {
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
    } = this.sequelize.models;

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

  static searchParameters() {
    return {
      ...super.searchParameters(),
      identifier: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['identifier', '[]']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
      },
      category: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['category', '[]', 'coding', '[]']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.CODING,
      },
      intent: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [['intent']],
      },
      occurrence: {
        type: FHIR_SEARCH_PARAMETERS.DATE,
        path: [['occurrenceDateTime']],
      },
      priority: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [['priority']],
      },
      status: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [['status']],
      },
    };
  }
}
