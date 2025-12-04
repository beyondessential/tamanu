import { DataTypes, type InitOptions } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from './Resource';
import type { Models } from '../../types/model';
import {
  fromImagingRequests,
  fromLabRequests,
  getIsLive,
  getQueryOptions,
  getValues,
  searchParameters,
  shouldForceRematerialise,
} from '../../utils/fhir/ServiceRequest';

export class FhirServiceRequest extends FhirResource {
  declare identifier?: Record<string, any>;
  declare status: string;
  declare intent: string;
  declare category?: Record<string, any>;
  declare priority?: string;
  declare code?: Record<string, any>;
  declare orderDetail?: Record<string, any>;
  declare subject: Record<string, any>;
  declare encounter?: Record<string, any>;
  declare occurrenceDateTime?: string;
  declare requester?: Record<string, any>;
  declare locationCode?: Record<string, any>;
  declare note?: Record<string, any>;
  declare specimen?: Record<string, any>;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
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
        encounter: DataTypes.JSONB,
        occurrenceDateTime: DataTypes.TEXT,
        requester: DataTypes.JSONB,
        locationCode: DataTypes.JSONB,
        note: DataTypes.JSONB,
        specimen: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.ImagingRequest, models.LabRequest];
    this.upstreams = [
      models.ImagingRequest,
      models.ImagingRequestArea,
      models.ImagingAreaExternalCode,
      models.ImagingTypeExternalCode,
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
    this.referencedResources = [
      models.FhirPatient,
      models.FhirEncounter,
      models.FhirPractitioner,
      models.FhirSpecimen,
    ];
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.INSTANCE.READ,
    FHIR_INTERACTIONS.TYPE.SEARCH,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  ]);

  async updateMaterialisation() {
    const upstream = await this.getUpstream(getQueryOptions(this.sequelize.models));
    const values = await getValues(upstream!, this.sequelize.models);
    this.set(values);
  }

  async updateIsLive() {
    const upstream = await this.getUpstream(getQueryOptions(this.sequelize.models));
    const isLive = getIsLive(upstream!, this.sequelize.models);
    this.isLive = isLive;
  }

  async shouldForceRematerialise() {
    const upstream = await this.getUpstream(getQueryOptions(this.sequelize.models));
    return shouldForceRematerialise(upstream!, this, this.sequelize.models);
  }

  static async queryToFindUpstreamIdsFromTable(upstreamTable: string, table: string, id: string) {
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
