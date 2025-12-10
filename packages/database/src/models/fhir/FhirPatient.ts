import { DataTypes, type InitOptions } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirReference } from '@tamanu/shared/services/fhirTypes';
import { FhirResource } from './Resource';
import type { Models } from '../../types/model';
import {
  fromPatients,
  getQueryOptions,
  getValues,
  searchParameters,
} from '../../utils/fhir/Patient';
import { Patient } from '../Patient';

export class FhirPatient extends FhirResource {
  declare extension?: Record<string, any>;
  declare identifier?: Record<string, any>;
  declare active: boolean;
  declare name?: Record<string, any>;
  declare telecom?: Record<string, any>;
  declare gender: string;
  declare birthDate?: string;
  declare deceasedDateTime?: string;
  declare address?: Record<string, any>;
  declare link?: Record<string, any>;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
      {
        extension: DataTypes.JSONB,
        identifier: DataTypes.JSONB,
        active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        name: DataTypes.JSONB,
        telecom: DataTypes.JSONB,
        gender: {
          type: DataTypes.TEXT,
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
    this.referencedResources = [
      // FhirPatients can reference eachother, but not flagging here to avoid a circular dependency
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

  async getRelatedUpstreamIds() {
    const upstream = await this.getUpstream<Patient>();
    const mergedUp = await upstream?.getMergedUp();
    const mergedDown = await upstream?.getMergedDown();

    return [...(mergedUp?.map(u => u.id) || []), ...(mergedDown?.map(u => u.id) || [])];
  }

  static async queryToFindUpstreamIdsFromTable(
    upstreamTable: string,
    table: string,
    id: string,
    deletedRow = null,
  ) {
    const { Patient } = this.sequelize.models;

    if (upstreamTable === Patient.tableName) {
      return fromPatients(this.sequelize.models, table, id, deletedRow);
    }
    return null;
  }

  asFhir() {
    const resource = super.asFhir();

    const { FhirPatient } = this.sequelize.models;

    // Exclude upstream links if they remain in the materialised data.
    // This can occur if there are records in the Tamanu data that have not been
    // materialised into the FHIR data, but are referred to by the patient links.
    // Although that should not really happen, but it's better to be safe and not
    // expose the upstream link data.
    resource.link = resource.link.filter(
      (link: Record<string, any>) =>
        link.other.type !== FhirReference.unresolvedReferenceType(FhirPatient),
    );
    return resource;
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      ...searchParameters,
    };
  }
}
