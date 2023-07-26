import { Sequelize, DataTypes } from 'sequelize';

import { FhirResource } from '../Resource';
import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { getQueryOptions } from './getQueryOptions';
import { getValues } from './getValues';
import { fromPatients } from './getQueryToFindUpstreamIds';
import { searchParameters } from './searchParameters';

export class FhirPatient extends FhirResource {
  static init(options, models) {
    super.init(
      {
        extension: DataTypes.JSONB,
        identifier: DataTypes.JSONB,
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        name: DataTypes.JSONB,
        telecom: DataTypes.JSONB,
        gender: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        birthDate: DataTypes.TEXT,
        deceasedDateTime: DataTypes.TEXT,
        address: DataTypes.JSONB,
        link: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.Patient];
    this.upstreams = [models.Patient, models.PatientAdditionalData];
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

  async getRelatedUpstreamIds() {
    const upstream = await this.getUpstream();
    const mergedUp = await upstream.getMergedUp();
    const mergedDown = await upstream.getMergedDown();

    return [...mergedUp.map(u => u.id), ...mergedDown.map(u => u.id)];
  }

  static async queryToFindUpstreamIdsFromTable(upstreamTable, table, id, deletedRow = null) {
    const { Patient } = this.sequelize.models;

    if (upstreamTable === Patient.tableName) {
      return fromPatients(this.sequelize.models, table, id, deletedRow);
    }
    return null;
  }

  asFhir() {
    const resource = super.asFhir();
    // Exclude upstream links if they remain in the materialised data.
    // This can occur if there are records in the Tamanu data that have not been
    // materialised into the FHIR data, but are referred to by the patient links.
    // Although that should not really happen, but it's better to be safe and not
    // expose the upstream link data.
    resource.link = resource.link.filter(link => link.other.type !== 'upstream://patient');
    return resource;
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      ...searchParameters,
    };
  }
}
