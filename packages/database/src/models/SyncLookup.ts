import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model.ts';
import type { InitOptions } from '../types/model.ts';

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

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        recordId: { type: DataTypes.TEXT },
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
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        tableName: 'sync_lookup',
        timestamps: false,
      },
    );
  }
}
