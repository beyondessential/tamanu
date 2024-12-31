import { DataTypes } from 'sequelize';
import {
  IMAGING_TYPES_VALUES,
  OTHER_REFERENCE_TYPES,
  REFERENCE_TYPES,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { Model } from './Model';

export class InvoiceProduct extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        price: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        discountable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
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

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
  
  static getFullReferenceAssociations() {
    return ['referenceData', 'labTestType'];
  }

  addVirtualFields() {
    this.dataValues.type =
      this.referenceData?.type ??
      (this.labTestType?.code
        ? OTHER_REFERENCE_TYPES.LAB_TEST_TYPE
        : IMAGING_TYPES_VALUES.includes(this.id)
        ? REFERENCE_TYPES.IMAGING_TYPE
        : undefined);
    this.dataValues.code =
      this.referenceData?.code ??
      this.labTestType?.code ??
      (IMAGING_TYPES_VALUES.includes(this.id) ? this.id : undefined);
    return this;
  }
}
