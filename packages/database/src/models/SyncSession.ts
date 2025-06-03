import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
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
  declare parameters?: Record<string, object>;

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
        parameters: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  /**
   * Set business-logic parameters to the sync session.
   * As this writes to the table, it may contend locks.
   * For debugging information, use addDebugInfo() instead.
   */
  static async setParameters(id: string, params: { [key: string]: any }) {
    await this.sequelize.query(
      `
      UPDATE "sync_sessions"
      SET "parameters" = (COALESCE("parameters", '{}'::jsonb) || $data::jsonb)
      WHERE "id" = $id
      `,
      { bind: { id, data: JSON.stringify(params) } },
    );
  }

  /**
   * Add information useful for debugging sync to the session.
   * To avoid contending locks, this will drop the data if it
   * can't obtain the write. For business-logic parameters, use
   * setParameters() instead.
   */
  static async addDebugInfo(id: string, info: { [key: string]: any }) {
    // the SKIP LOCKED means we don't lock the sync_sessions table's row
    // if it's already contended. but that also means that we might lose
    // some debug info in some cases. so let's debug log it as well.
    log.debug('Sync session debug', { id, ...info });
    const session = await this.findOne({ where: { id }, skipLocked: true });
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
