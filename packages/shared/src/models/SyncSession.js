import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';

export class SyncSession extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        startTime: { type: DataTypes.DATE },
        lastConnectionTime: { type: DataTypes.DATE },
        snapshotStartedAt: { type: DataTypes.DATE },
        snapshotCompletedAt: { type: DataTypes.DATE },
        persistCompletedAt: { type: DataTypes.DATE },
        completedAt: { type: DataTypes.DATE },
        startedAtTick: { type: DataTypes.BIGINT },
        pullSince: { type: DataTypes.BIGINT },
        pullUntil: { type: DataTypes.BIGINT },
        error: { type: DataTypes.TEXT },
        debugInfo: { type: DataTypes.JSON },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  static async addDebugInfo(id, info) {
    const session = await this.findOne({ where: { id } });
    await session.update({
      debugInfo: { ...session.debugInfo, ...info },
    });
  }
}
