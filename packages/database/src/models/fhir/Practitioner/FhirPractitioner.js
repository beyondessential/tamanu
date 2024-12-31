import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from '../Resource';
import { getQueryOptions } from './getQueryOptions';
import { getValues } from './getValues';
import { fromUsers } from './getQueryToFindUpstreamIds';
import { searchParameters } from './searchParameters';

export class FhirPractitioner extends FhirResource {
  static init(options, models) {
    super.init(
      {
        name: DataTypes.JSONB,
        identifier: DataTypes.JSONB,
        telecom: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.User];
    this.upstreams = [models.User];
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
    const { User } = this.sequelize.models;

    if (upstreamTable === User.tableName) {
      return fromUsers(this.sequelize.models, table, id, deletedRow);
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
