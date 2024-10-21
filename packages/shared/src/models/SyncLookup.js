import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';

export class SyncLookup extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        recordId: { type: DataTypes.STRING },
        recordType: { type: DataTypes.STRING },
        data: { type: DataTypes.JSON },
        updatedAtSyncTick: { type: DataTypes.BIGINT },
        patientId: { type: DataTypes.STRING },
        encounterId: { type: DataTypes.STRING },
        facilityId: { type: DataTypes.STRING },
        isLabRequest: { type: DataTypes.BOOLEAN },
        isDeleted: { type: DataTypes.BOOLEAN },
        updatedAtByFieldSum: { type: DataTypes.BIGINT },
        pushedByDeviceId: { type: DataTypes.TEXT },
      },
      {
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        ...options,
        tableName: 'sync_lookup',
        timestamps: false,
      },
    );
  }
}
