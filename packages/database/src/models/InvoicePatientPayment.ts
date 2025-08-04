import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { InitOptions, Models } from '../types/model';

export class InvoicePatientPayment extends Model {
  declare id: string;
  declare methodId: string;
  declare chequeNumber?: string;
  declare invoicePaymentId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        methodId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        chequeNumber: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
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

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
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

  static getListReferenceAssociations(models: Models) {
    return [
      {
        model: models.ReferenceData,
        as: 'method',
      },
    ];
  }
}
