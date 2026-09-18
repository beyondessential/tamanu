import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import type { InitOptions, Models } from '../types/model';

export class PatientInvoiceInsurancePlan extends Model {
  declare id: string;
  declare patientId: string;
  declare invoiceInsurancePlanId: string;
  declare visibilityStatus: string;

  // The composite primary key gives each (patient, plan) pair exactly one row for its whole
  // lifecycle. Removing a plan sets visibilityStatus to historical and re-adding it sets it
  // back to current, so the single row is updated in place rather than soft-deleted and
  // restored — which is why this model has no need for facility-originated restores.

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          // Deterministic id from (patient_id, invoice_insurance_plan_id), same pattern as patient_facilities
          type: `TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("invoice_insurance_plan_id", ';', ':')) STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
        },
        patientId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'patients',
            key: 'id',
          },
        },
        invoiceInsurancePlanId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'invoice_insurance_plans',
            key: 'id',
          },
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          { fields: ['patientId'] },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.InvoiceInsurancePlan, {
      foreignKey: 'invoiceInsurancePlanId',
      as: 'invoiceInsurancePlan',
    });
  }

  static async buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
