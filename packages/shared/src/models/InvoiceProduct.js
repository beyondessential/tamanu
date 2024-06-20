import { DataTypes } from 'sequelize';
import { IMAGING_TYPES_VALUES, REFERENCE_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
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
        undiscountable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        type: {
          type: DataTypes.VIRTUAL,
          get() {
            if (IMAGING_TYPES_VALUES.includes(this.id)) return REFERENCE_TYPES.IMAGING_TYPE;
            return this.referenceData?.type ?? this.labTestType?.code ? 'labTestType' : undefined;
          },
        },
        code: {
          type: DataTypes.VIRTUAL,
          get() {
            if (IMAGING_TYPES_VALUES.includes(this.id)) return this.id;
            return this.referenceData?.code ?? this.labTestType?.code;
          },
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

  static getFullReferenceAssociations() {
    return ['referenceData', 'labTestType'];
  }

  static sanitizeForFacilityServer(product) {
    //remove virtual fields for sync
    delete product.type;
    delete product.code;
    return product;
  }
  static sanitizeForCentralServer(product) {
    //remove virtual fields for sync
    const { type: _type, code: _code, ...rest } = product;
    delete product.type;
    delete product.code;
    return product;
  }
}
