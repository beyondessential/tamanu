import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from './Resource.ts';
import {
  getQueryOptions,
  getValues,
  fromUsers,
  searchParameters,
} from '../../utils/fhir/Practitioner/index.ts';
import type { InitOptions, Models } from '../../types/model.ts';

export class FhirPractitioner extends FhirResource {
  declare name?: Record<string, any>;
  declare identifier?: Record<string, any>;
  declare telecom?: Record<string, any>;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
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
    const upstream = await this.getUpstream(getQueryOptions());
    const values = await getValues(upstream!, this.sequelize.models);
    this.set(values);
  }

  static async queryToFindUpstreamIdsFromTable(upstreamTable: string, table: string, id: string) {
    const { User } = this.sequelize.models;

    if (upstreamTable === User.tableName) {
      return fromUsers(this.sequelize.models, table, id);
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
