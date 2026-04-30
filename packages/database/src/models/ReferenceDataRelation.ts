import { Sequelize, DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

const REFERENCE_DATA_RELATION_TYPE_VALUES = Object.values(REFERENCE_DATA_RELATION_TYPES);

export class ReferenceDataRelation extends Model {
  declare id: string;
  declare referenceDataId?: string;
  declare referenceDataParentId?: string;
  declare type: (typeof REFERENCE_DATA_RELATION_TYPE_VALUES)[number];

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        type: {
          type: DataTypes.ENUM(...REFERENCE_DATA_RELATION_TYPE_VALUES),
          defaultValue: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
        },
        referenceDataParentId: {
          type: DataTypes.TEXT,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
        referenceDataId: {
          type: DataTypes.TEXT,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referenceDataId',
      as: 'referenceData',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referenceDataParentId',
      as: 'referenceDataParent',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
