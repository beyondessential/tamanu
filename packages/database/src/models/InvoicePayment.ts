import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { dateType, type InitOptions, type Models } from '../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

export class InvoicePayment extends Model {
  declare id: string;
  declare date: string;
  declare receiptNumber: string;
  declare amount: number;
  declare invoiceId?: string;
  declare updatedByUserId?: string;

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

  static buildSyncLookupQueryDetails() {
    return {
      select: buildEncounterLinkedLookupSelect(this),
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
    ];
  }
}
