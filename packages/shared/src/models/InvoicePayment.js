import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from './buildEncounterLinkedSyncFilter';
import { dateType } from './dateTimeTypes';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

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
    this.belongsTo(models.User, {
      foreignKey: 'updatedByUserId',
      as: 'updatedByUser',
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

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'invoices', 'encounters']),
    };
  }

  /**
   *
   * @param {import('./')} models
   */
  static getListReferenceAssociations(models) {
    return [
      {
        model: models.User,
        as: 'updatedByUser',
      },
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
