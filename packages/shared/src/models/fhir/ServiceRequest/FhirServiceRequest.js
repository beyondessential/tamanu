import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from '../Resource';

import { getQueryOptions } from './getQueryOptions';
import { getValues } from './getValues';
import { fromImagingRequests, fromLabRequests } from './getQueryToFindUpstreamIds';
import { searchParameters } from './searchParameters';

export class FhirServiceRequest extends FhirResource {
  static init(options, models) {
    super.init(
      {
        contained: DataTypes.JSONB,
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
        encounter: DataTypes.JSONB,
        occurrenceDateTime: DataTypes.TEXT,
        requester: DataTypes.JSONB,
        locationCode: DataTypes.JSONB,
        note: DataTypes.JSONB,
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
      models.LabRequest,
      models.LabTest,
      models.LabTestType,
      models.LabTestPanelRequest,
      models.LabTestPanel,
      models.Note,
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

  static async queryToFindUpstreamIdsFromTable(upstreamTable, table, id) {
    const { ImagingRequest, LabRequest } = this.sequelize.models;

    if (upstreamTable === ImagingRequest.tableName) {
      return fromImagingRequests(this.sequelize.models, table, id);
    }
    if (upstreamTable === LabRequest.tableName) {
      return fromLabRequests(this.sequelize.models, table, id);
    }
    return null;
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      ...searchParameters,
    };
  }
}
