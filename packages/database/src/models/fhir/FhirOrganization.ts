import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from './Resource';
import type { InitOptions, Models } from '../../types/model';
import {
  fromFacilities,
  getQueryOptions,
  getValues,
  searchParameters,
} from '../../utils/fhir/Organization';

export class FhirOrganization extends FhirResource {
  identifier?: Record<string, any>;
  name?: string;
  active?: boolean;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
      {
        identifier: DataTypes.JSONB,
        name: DataTypes.TEXT,
        active: DataTypes.BOOLEAN,
      },
      options,
    );

    this.UpstreamModels = [models.Facility];
    this.upstreams = [models.Facility];
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
    const { Facility } = this.sequelize.models;

    if (upstreamTable === Facility.tableName) {
      return fromFacilities(this.sequelize.models, table, id);
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
