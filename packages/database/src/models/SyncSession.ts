import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { type InitOptions } from '../types/model';

export class SyncSession extends Model {
  declare id: string;
  declare startTime?: Date;
  declare lastConnectionTime?: Date;
  declare snapshotStartedAt?: Date;
  declare snapshotCompletedAt?: Date;
  declare persistCompletedAt?: Date;
  declare completedAt?: Date;
  declare startedAtTick?: number;
  declare pullSince?: number;
  declare pullUntil?: number;
  declare errors?: string;
  declare debugInfo?: Record<string, object>;

  static initModel({ primaryKey, ...options }: InitOptions) {
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
        errors: { type: DataTypes.ARRAY(DataTypes.TEXT) },
        debugInfo: { type: DataTypes.JSON },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static async addDebugInfo(id: string, info: object) {
    const session = await this.findOne({ where: { id } });
    await session?.update({
      debugInfo: { ...session.debugInfo, ...info },
    });
  }

  /**
   * @param {number} tick sync tick
   */
  async markAsStartedAt(tick: number) {
    return this.sequelize.models.SyncSession?.update(
      { startedAtTick: tick },
      { where: { id: this.id } },
    );
  }

  async markErrored(error: string) {
    const errors = this.errors || [];
    await this.update({
      errors: [...errors, error],
      completedAt: new Date(),
    });
  }

  static async markSessionErrored(id: string, error: string) {
    const session = await this.findByPk(id);
    await session?.markErrored(error);
  }
}
