import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateType } from './dateTimeTypes';

export class InvoicePayment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        date: dateType('date', {
          allowNull: false,
        }),
        receiptNumber: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        amount: {
          type: DataTypes.DECIMAL,
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
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });
    this.hasOne(models.InvoicePatientPayment, {
      foreignKey: 'invoicePaymentId',
      as: 'patientPayment',
    });
    this.hasOne(models.InvoiceInsurerPayment, {
      foreignKey: 'invoicePaymentId',
      as: 'insurerPayment',
    });
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'invoices', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  /**
   *
   * @param {import('./')} models
   */
  static getListReferenceAssociations(models) {
    return [
      {
        model: models.InvoicePatientPayment,
        as: 'patientPayment',
        include: models.InvoicePatientPayment.getListReferenceAssociations(models),
      },
      {
        model: models.InvoiceInsurerPayment,
        as: 'insurerPayment',
        include: models.InvoiceInsurerPayment.getListReferenceAssociations(models),
      },
    ];
  }
}
