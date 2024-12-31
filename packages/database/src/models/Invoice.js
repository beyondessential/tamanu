import { DataTypes } from 'sequelize';
import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { dateTimeType } from '../types/model';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';

export class Invoice extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        displayId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        date: dateTimeType('date', {
          allowNull: false,
        }),
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        patientPaymentStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID,
        },
        insurerPaymentStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: INVOICE_INSURER_PAYMENT_STATUSES.UNPAID,
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
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.hasOne(models.InvoiceDiscount, {
      foreignKey: 'invoiceId',
      as: 'discount',
    });

    this.hasMany(models.InvoiceInsurer, {
      foreignKey: 'invoiceId',
      as: 'insurers',
    });

    this.hasMany(models.InvoiceItem, {
      foreignKey: 'invoiceId',
      as: 'items',
    });

    this.hasMany(models.InvoicePayment, {
      foreignKey: 'invoiceId',
      as: 'payments',
    });
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }

  static getFullReferenceAssociations() {
    const { models } = this.sequelize;

    return [
      'encounter',
      {
        model: models.InvoiceDiscount,
        as: 'discount',
        include: [{ model: models.User, as: 'appliedByUser', attributes: ['displayName'] }],
      },
      {
        model: models.InvoiceInsurer,
        as: 'insurers',
        include: [
          {
            model: models.ReferenceData,
            as: 'insurer',
          },
        ],
      },
      {
        model: models.InvoiceItem,
        as: 'items',
        include: models.InvoiceItem.getListReferenceAssociations(models),
      },
      {
        model: models.InvoicePayment,
        as: 'payments',
        include: models.InvoicePayment.getListReferenceAssociations(models),
      },
    ];
  }
}
