import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { dateType, type InitOptions, type Models } from '../../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../../sync/buildEncounterLinkedLookupFilter';

export class InvoicePayment extends Model {
  declare id: string;
  declare date: string;
  declare receiptNumber: string;
  declare amount: number;
  declare invoiceId?: string;
  declare updatedByUserId?: string;
  declare originalPaymentId?: string;
  declare originalPayment?: InvoicePayment;
  declare refundPayment?: InvoicePayment;
  

  static initModel({ primaryKey, ...options }: InitOptions) {
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
        originalPaymentId: {
          type: DataTypes.UUID,
          allowNull: true,
          unique: true,
        },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
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
    this.belongsTo(models.InvoicePayment, {
      foreignKey: 'originalPaymentId',
      as: 'originalPayment',
    });
    this.hasOne(models.InvoicePayment, {
      foreignKey: 'originalPaymentId',
      as: 'refundPayment',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'invoices', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['invoices', 'encounters']),
    };
  }

  static getListReferenceAssociations(models: Models) {
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
      {
        model: models.InvoicePayment,
        as: 'refundPayment',
      },
      {
        model: models.InvoicePayment,
        as: 'originalPayment',
      },
    ];
  }
}
