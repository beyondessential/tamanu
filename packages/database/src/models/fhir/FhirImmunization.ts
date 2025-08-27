import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from './Resource';
import {
  getQueryOptions,
  getValues,
  fromAdministeredVaccines,
  searchParameters,
} from '../../utils/fhir/Immunization';
import type { InitOptions, Models } from '../../types/model';

export class FhirImmunization extends FhirResource {
  declare status: string;
  declare vaccineCode: Record<string, any>;
  declare patient: Record<string, any>;
  declare encounter?: Record<string, any>;
  declare occurrenceDateTime?: string;
  declare lotNumber?: string;
  declare site?: Record<string, any>;
  declare performer?: Record<string, any>;
  declare protocolApplied?: Record<string, any>;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
      {
        status: {
          type: DataTypes.TEXT,
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
        occurrenceDateTime: DataTypes.TEXT,
        lotNumber: DataTypes.TEXT,
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
    this.referencedResources = [models.FhirPatient, models.FhirEncounter, models.FhirPractitioner];
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

  static async queryToFindUpstreamIdsFromTable(upstreamTable: string, table: string, id: string) {
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
