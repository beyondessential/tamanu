import { DataTypes } from 'sequelize';
import {
  IMAGING_TYPES_VALUES,
  OTHER_REFERENCE_TYPES,
  REFERENCE_TYPES,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { ReferenceData } from './ReferenceData';
import type { LabTestType } from './LabTestType';

export class InvoiceProduct extends Model {
  declare id: string;
  declare name: string;
  declare price: number;
  declare discountable: boolean;
  declare visibilityStatus: string;
  declare referenceData?: ReferenceData;
  declare labTestType?: LabTestType;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        price: {
          type: DataTypes.DECIMAL,
          allowNull: true,
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
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
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
    this.hasMany(models.PriceListItem, {
      foreignKey: 'invoiceProductId',
      as: 'priceListItems',
    });
    this.hasOne(models.PriceListItem, {
      foreignKey: 'invoiceProductId',
      as: 'priceListItem',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
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
