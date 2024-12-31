import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export class InvoiceInsurerPayment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        insurerId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        reason: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  /**
   *
   * @param {import('.')} models
   */
  static initRelations(models) {
    this.belongsTo(models.InvoicePayment, {
      foreignKey: 'invoicePaymentId',
      as: 'detail',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'insurerId',
      as: 'insurer',
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

  static buildSyncLookupQueryDetails() {
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

  static getFullReferenceAssociations() {
    return [
      {
        model: this.sequelize.models.InvoicePayment,
        as: 'detail',
      },
    ];
  }

  /**
   *
   * @param {import('.')} models
   */
  static getListReferenceAssociations(models) {
    return [
      {
        model: models.ReferenceData,
        as: 'insurer',
      },
    ];
  }
}
