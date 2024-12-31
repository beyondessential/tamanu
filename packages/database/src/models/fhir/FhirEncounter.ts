import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from './Resource';
import {
  getQueryOptions,
  getValues,
  fromEncounters,
  searchParameters,
  filterFromEncounters,
} from '../../utils/fhir/Encounter';
import type { InitOptions, Models } from '../../types/model';

export class FhirEncounter extends FhirResource {
  status!: string;
  class?: Record<string, any>;
  subject?: Record<string, any>;
  actualPeriod?: Record<string, any>;
  location?: Record<string, any>;
  serviceProvider?: Record<string, any>;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
      {
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        class: DataTypes.JSONB,
        subject: DataTypes.JSONB,
        actualPeriod: DataTypes.JSONB,
        location: DataTypes.JSONB,
        serviceProvider: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.Encounter];
    this.upstreams = [
      models.Encounter,
      models.Discharge,
      models.Patient,
      models.Location,
      models.LocationGroup,
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

  static async queryToFindUpstreamIdsFromTable(
    upstreamTable: string,
    table: string,
    id: string,
    deletedRow = null,
  ) {
    const { Encounter } = this.sequelize.models;

    if (upstreamTable === Encounter.tableName) {
      return fromEncounters(this.sequelize.models, table, id, deletedRow);
    }
    return null;
  }

  static async queryToFilterUpstream(upstreamTable: string) {
    const { Encounter } = this.sequelize.models;

    if (upstreamTable === Encounter.tableName) {
      return filterFromEncounters(this.sequelize.models, upstreamTable);
    }

    return null;
  }

  asFhir() {
    const resource = super.asFhir();

    // Exclude unresolved upstream if it remains in the materialised data.
    if (resource.subject.type === 'upstream://patient') {
      delete resource.subject;
    }

    return resource;
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      ...searchParameters,
    };
  }
}
