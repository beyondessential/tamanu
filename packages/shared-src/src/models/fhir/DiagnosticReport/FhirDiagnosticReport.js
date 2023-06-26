import { Sequelize, DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from 'shared/constants';

import { FhirResource } from '../Resource';
import { fromLabTests } from './getQueryToFindUpstreamIds';
import { getQueryOptions } from './getQueryOptions';
import { getValues } from './getValues';

export class FhirDiagnosticReport extends FhirResource {
  static init(options, models) {
    super.init(
      {
        extension: DataTypes.JSONB, // This field is part of DomainResource
        identifier: DataTypes.JSONB,
        status: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        code: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        subject: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        effectiveDateTime: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        issued: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        performer: DataTypes.JSONB,
        result: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.LabTest];
    this.upstreams = [
      models.LabTest,
      models.LabRequest,
      models.LabTestType,
      models.ReferenceData,
      models.Encounter,
      models.Patient,
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
    const { LabTest } = this.sequelize.models;

    if (upstreamTable === LabTest.tableName) {
      return fromLabTests(this.sequelize.models, table, id);
    }
    return null;
  }
}
