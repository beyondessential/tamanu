import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class InvoiceProduct extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: DataTypes.TEXT,
        price: DataTypes.DECIMAL,
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  /**
   *
   * @param {import('.')} models
   */
  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'id',
      as: 'referenceData',
      constraints: false,
    });
    this.belongsTo(models.LabTestType, {
      foreignKey: 'id',
      as: 'labTestType',
      constraints: false,
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
