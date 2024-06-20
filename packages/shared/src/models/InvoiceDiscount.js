import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';

export class InvoiceDiscount extends Model {
  static init({ primaryKey, ...options }) {
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

    this.belongsTo(models.User, {
      foreignKey: 'appliedByUserId',
      as: 'appliedByUser',
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
}
