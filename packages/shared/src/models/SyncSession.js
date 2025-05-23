import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { log } from '@tamanu/shared/services/logging';

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
        errors: { type: DataTypes.ARRAY(DataTypes.TEXT) },
        debugInfo: { type: DataTypes.JSON },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  /**
   * Set business-logic parameters to the sync session.
   * As this writes to the table, it may contend locks.
   * For debugging information, use addDebugInfo() instead.
   */
  static async setParameters(id, params) {
    await this.sequelize.query(
      `
      UPDATE "sync_sessions"
      SET "debug_info" = (COALESCE("debug_info"::jsonb, '{}'::jsonb) || $data::jsonb)::json
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
  static async addDebugInfo(id, info) {
    // the SKIP LOCKED means we don't lock the sync_sessions table's row
    // if it's already contended. but that also means that we might lose
    // some debug info in some cases. so let's debug log it as well.
    log.debug('Sync session debug', { id, ...info });
    const session = await this.findOne({ where: { id }, skipLocked: true });
    await session?.update({
      debugInfo: { ...session.debugInfo, ...info },
    });
  }

  async markErrored(error) {
    const errors = this.errors || [];
    await this.update({
      errors: [...errors, error],
      completedAt: new Date(),
    });
  }

  static async markSessionErrored(id, error) {
    const session = await this.findByPk(id);
    await session.markErrored(error);
  }
}
