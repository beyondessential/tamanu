import { DataTypes } from 'sequelize';
import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../../types/model';

export class FinanceInvoice extends Model {
  declare id: string;
  declare displayId: string;
  declare date: string;
  declare status: string;
  declare patientPaymentStatus: string;
  declare insurerPaymentStatus: string;
  declare encounterId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
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
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.hasOne(models.FinanceInvoiceDiscount, {
      foreignKey: 'invoiceId',
      as: 'discount',
    });

    this.hasMany(models.FinanceInvoiceInsurer, {
      foreignKey: 'invoiceId',
      as: 'insurers',
    });

    this.hasMany(models.FinanceInvoiceItem, {
      foreignKey: 'invoiceId',
      as: 'items',
    });

    this.hasMany(models.FinanceInvoicePayment, {
      foreignKey: 'invoiceId',
      as: 'payments',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }

  static getFullReferenceAssociations() {
    const { models } = this.sequelize;

    return [
      'encounter',
      {
        model: models.FinanceInvoiceDiscount,
        as: 'discount',
        include: [{ model: models.User, as: 'appliedByUser', attributes: ['displayName'] }],
      },
      {
        model: models.FinanceInvoiceInsurer,
        as: 'insurers',
        include: [
          {
            model: models.ReferenceData,
            as: 'insurer',
          },
        ],
      },
      {
        model: models.FinanceInvoiceItem,
        as: 'items',
        include: models.FinanceInvoiceItem.getListReferenceAssociations(models),
      },
      {
        model: models.FinanceInvoicePayment,
        as: 'payments',
        include: models.FinanceInvoicePayment.getListReferenceAssociations(models),
      },
    ];
  }
}
