import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export class InvoicePatientPayment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        methodId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  /**
   *
   * @param {import('./')} models
   */
  static initRelations(models) {
    this.belongsTo(models.InvoicePayment, {
      foreignKey: 'invoicePaymentId',
      as: 'detail',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'methodId',
      as: 'method',
      constraints: false,
    });
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'invoice_payments', 'invoices', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupFilter() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([
        this.tableName,
        'invoice_payments',
        'invoices',
        'encounters',
      ]),
    };
  }

  /**
   *
   * @param {import('./')} models
   */
  static getListReferenceAssociations(models) {
    return [
      {
        model: models.ReferenceData,
        as: 'method',
      },
    ];
  }
}
