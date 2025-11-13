import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { dateTimeType, type InitOptions, type Models } from '../../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../../sync/buildEncounterLinkedLookupFilter';

export class InvoiceDiscount extends Model {
  declare id: string;
  declare percentage: number;
  declare reason?: string;
  declare isManual: boolean;
  declare appliedTime: string;
  declare invoiceId?: string;
  declare appliedByUserId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        percentage: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        reason: DataTypes.STRING,
        isManual: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        appliedTime: dateTimeType('appliedTime', {
          allowNull: false,
        }),
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    this.belongsTo(models.User, {
      foreignKey: 'appliedByUserId',
      as: 'appliedByUser',
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
}
