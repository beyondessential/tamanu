import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import type { InitOptions, Models } from '../types/model';

export class PatientInvoiceInsurancePlan extends Model {
  declare id: string;
  declare patientId: string;
  declare invoiceInsurancePlanId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        patientId: {
          type: DataTypes.STRING,
          references: {
            model: 'patients',
            key: 'id',
          },
        },
        invoiceInsurancePlanId: {
          type: DataTypes.STRING,
          references: {
            model: 'invoice_insurance_plans',
            key: 'id',
          },
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          { fields: ['patientId'] },
          { unique: true, fields: ['patientId', 'invoiceInsurancePlanId'] },
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
