import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from './Resource';
import {
  filterFromLabRequests,
  fromLabRequest,
  getQueryOptions,
  getValues,
  searchParameters,
} from '../../utils/fhir/Specimen';
import type { InitOptions, Models } from '../../types/model';

export class FhirSpecimen extends FhirResource {
  declare collection?: Record<string, any>;
  declare request?: Record<string, any>;
  declare type?: Record<string, any>;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
      {
        collection: DataTypes.JSONB,
        request: DataTypes.JSONB,
        type: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.LabRequest];
    this.upstreams = [models.LabRequest];
    this.referencedResources = [
      models.FhirPractitioner,
      // FhirServiceRequest is also referenced by Specimen, but not flagging here to avoid a circular dependency
    ];
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.INSTANCE.READ,
    FHIR_INTERACTIONS.TYPE.SEARCH,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  ]);

  async updateMaterialisation() {
    const upstream = await this.getUpstream(getQueryOptions());
    const values = await getValues(upstream!, this.sequelize.models);
    this.set(values);
  }

  static async queryToFindUpstreamIdsFromTable(upstreamTable: string, table: string, id: string) {
    const { LabRequest } = this.sequelize.models;

    if (upstreamTable === LabRequest.tableName) {
      return fromLabRequest(this.sequelize.models, table, id);
    }
    return null;
  }

  static async queryToFilterUpstream(upstreamTable: string) {
    const { LabRequest } = this.sequelize.models;
    if (upstreamTable === LabRequest.tableName) {
      return filterFromLabRequests(this.sequelize.models, upstreamTable);
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
