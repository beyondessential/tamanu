import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from '../Resource';
import { getQueryOptions } from './getQueryOptions';
import { getValues } from './getValues';
import { fromLabRequest } from './getQueryToFindUpstreamIds';
import { searchParameters } from './searchParameters';

export class FhirSpecimen extends FhirResource {
  static init(options, models) {
    super.init(
      {
        sampleTime: DataTypes.DATE,
        collection: DataTypes.JSONB,
        request: DataTypes.JSONB,
        type: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.LabRequest];
    this.upstreams = [models.LabRequest];
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

  static async queryToFindUpstreamIdsFromTable(upstreamTable, table, id, deletedRow = null) {
    const { LabRequest } = this.sequelize.models;

    if (upstreamTable === LabRequest.tableName) {
      return fromLabRequest(this.sequelize.models, table, id, deletedRow);
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
