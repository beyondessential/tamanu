import { DataTypes, type ModelAttributes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { type InitOptions } from '../types/model';

const getAttributes = (primaryKey: any) => ({
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
});

export class SyncSession extends Model<
  ModelAttributes<SyncSession, ReturnType<typeof getAttributes>>
> {
  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(getAttributes(primaryKey), {
      ...options,
      syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
    });
  }

  // eslint-disable-next-line no-unused-vars
  static async addDebugInfo(_id: string, _info: object) {
    // const session = await this.findOne({ where: { id } });
    // await session?.update({
    //   debugInfo: { ...session.debugInfo, ...info },
    // });
  }

  /**
   * @param {number} tick sync tick
   */
  // eslint-disable-next-line no-unused-vars
  async markAsStartedAt(_tick: number) {
    // return this.sequelize.models.SyncSession?.update(
    //   { startedAtTick: tick },
    //   { where: { id: this.id } },
    // );
  }

  // eslint-disable-next-line no-unused-vars
  async markErrored(_error: any) {
    // const errors = this.errors || [];
    // await this.update({
    //   errors: [...errors, error],
    //   completedAt: new Date(),
    // });
  }

  // eslint-disable-next-line no-unused-vars
  static async markSessionErrored(_id: any, _error: any) {
    // const session = await this.findByPk(id);
    // await session.markErrored(error);
  }
}
