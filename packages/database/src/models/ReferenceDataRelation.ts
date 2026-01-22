import { Sequelize, DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

const REFERENCE_DATA_RELATION_TYPE_VALUES = Object.keys(REFERENCE_DATA_RELATION_TYPES);

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
        referenceDataId: {
          type: DataTypes.TEXT,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
        referenceDataParentId: {
          type: DataTypes.TEXT,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
        type: {
          type: DataTypes.ENUM(...REFERENCE_DATA_RELATION_TYPE_VALUES),
          defaultValue: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
