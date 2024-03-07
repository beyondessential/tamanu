import { Sequelize, DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

const REFERENCE_DATA_RELATION_TYPES = {
  ADDRESS_HIERARCHY: 'ADDRESS_HIERARCHY',
  FACILITY_CATCHMENT: 'FACILITY_CATCHMENT',
};
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
        refDataId: {
          type: DataTypes.TEXT,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
        refDataParentId: {
          type: DataTypes.TEXT,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
        type: {
          type: DataTypes.STRING,
          defaultValue: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
