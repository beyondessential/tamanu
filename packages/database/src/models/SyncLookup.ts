import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions } from '../types/model';

export class SyncLookup extends Model {
  declare id: string;
  declare recordId?: string;
  declare recordType?: string;
  declare data?: Record<string, any>;
  declare updatedAtSyncTick?: number;
  declare patientId?: string;
  declare encounterId?: string;
  declare facilityId?: string;
  declare isLabRequest?: boolean;
  declare isDeleted?: boolean;
  declare updatedAtByFieldSum?: number;
  declare pushedByDeviceId?: string;
  declare needsRebuild?: boolean;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        recordId: { type: DataTypes.TEXT },
        recordType: { type: DataTypes.STRING },
        data: { type: DataTypes.JSON, allowNull: true },
        updatedAtSyncTick: { type: DataTypes.BIGINT },
        patientId: { type: DataTypes.STRING },
        encounterId: { type: DataTypes.STRING },
        facilityId: { type: DataTypes.STRING },
        isLabRequest: { type: DataTypes.BOOLEAN },
        isDeleted: { type: DataTypes.BOOLEAN },
        updatedAtByFieldSum: { type: DataTypes.BIGINT },
        pushedByDeviceId: { type: DataTypes.TEXT },
        needsRebuild: { type: DataTypes.BOOLEAN, defaultValue: false },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        tableName: 'sync_lookup',
        timestamps: false,
      },
    );
  }
}
