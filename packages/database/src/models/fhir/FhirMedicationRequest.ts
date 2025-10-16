import { DataTypes, type InitOptions } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from './Resource';
import type { Models } from '../../types/model';
import { PharmacyOrderPrescription } from '../../models';
import {
  getQueryToFindUpstreamIds,
  getValues,
  searchParameters,
} from '../../utils/fhir/MedicationRequest';

export class FhirMedicationRequest extends FhirResource {
  declare identifier?: Record<string, any>;
  declare status: string;
  declare intent: string;
  declare groupIdentifier?: Record<string, any>;
  declare category?: Record<string, any>;
  declare subject?: Record<string, any>;
  declare encounter?: Record<string, any>;
  declare medication?: Record<string, any>;
  declare authoredOn?: Date;
  declare requester?: Record<string, any>;
  declare recorder?: Record<string, any>;
  declare note?: Record<string, any>;
  declare dosageInstruction?: Record<string, any>;
  declare dispenseRequest?: Record<string, any>;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
      {
        identifier: DataTypes.JSONB,
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        intent: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        groupIdentifier: DataTypes.JSONB,
        category: DataTypes.JSONB,
        subject: DataTypes.JSONB,
        encounter: DataTypes.JSONB,
        medication: DataTypes.JSONB,
        authoredOn: DataTypes.DATE,
        requester: DataTypes.JSONB,
        recorder: DataTypes.JSONB,
        note: DataTypes.JSONB,
        dosageInstruction: DataTypes.JSONB,
        dispenseRequest: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.PharmacyOrderPrescription];
    this.upstreams = [
      models.PharmacyOrderPrescription,
      models.PharmacyOrder,
      models.Prescription,
      models.Encounter,
      models.Patient,
      models.User,
      models.ReferenceData,
      models.Facility,
    ];
    this.referencedResources = [
      models.FhirPatient,
      models.FhirOrganization,
      models.FhirEncounter,
      models.FhirPractitioner,
    ];
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.INSTANCE.READ,
    FHIR_INTERACTIONS.TYPE.SEARCH,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  ]);

  async updateMaterialisation() {
    const upstream = await this.getUpstream<PharmacyOrderPrescription>();
    if (!upstream) {
      throw new Error(
        `No upstream pharmacy_order_prescription found for medication_request: ${this.id}`,
      );
    }
    const values = await getValues(upstream, this.sequelize.models);
    this.set(values);
  }

  static async queryToFindUpstreamIdsFromTable(upstreamTable: string, table: string, id: string) {
    if (upstreamTable === PharmacyOrderPrescription.tableName) {
      return getQueryToFindUpstreamIds(this.sequelize.models, table, id);
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
