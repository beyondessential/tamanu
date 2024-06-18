import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';

export class Invoice extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        displayId: Sequelize.STRING,
        status: Sequelize.STRING,
        paymentStatus: Sequelize.STRING,
        receiptNumber: Sequelize.STRING,
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
  }

  static getFullReferenceAssociations() {
    return ['items'];
  }

  static buildPatientSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'encounters']);
  }
}
