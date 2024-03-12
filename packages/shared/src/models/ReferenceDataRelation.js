import { Sequelize, DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';
import { Model } from './Model';

export class ReferenceDataRelation extends Model {
  static init(options) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('uuid_generate_v4'),
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
          type: DataTypes.ENUM(Object.values(REFERENCE_DATA_RELATION_TYPES)),
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
}
