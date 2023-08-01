import { Sequelize, DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '../../../constants/fhir';
import { FhirResource } from '../Resource';
import { getQueryOptions } from './getQueryOptions';
import { getValues } from './getValues';
import { fromAdministeredVaccines } from './getQueryToFindUpstreamIds';
import { searchParameters } from './searchParameters';

export class FhirImmunization extends FhirResource {
  static init(options, models) {
    super.init(
      {
        status: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        vaccineCode: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        patient: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        encounter: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        occurrenceDateTime: Sequelize.TEXT,
        lotNumber: Sequelize.TEXT,
        site: DataTypes.JSONB,
        performer: DataTypes.JSONB,
        protocolApplied: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.AdministeredVaccine];
    this.upstreams = [
      models.AdministeredVaccine,
      models.Encounter,
      models.Patient,
      models.ReferenceData,
      models.ScheduledVaccine,
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

  static async queryToFindUpstreamIdsFromTable(upstreamTable, table, id) {
    const { AdministeredVaccine } = this.sequelize.models;

    if (upstreamTable === AdministeredVaccine.tableName) {
      return fromAdministeredVaccines(this.sequelize.models, table, id);
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
