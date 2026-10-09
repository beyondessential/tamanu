import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, SYNC_FACILITY_RUN_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

// spec: SYNRUN
//
// One row per facility sync attempt. Written as running before the attempt
// contacts central and updated with its outcome when it ends, so an attempt that
// hangs (or whose process dies) remains visible as a running row with an old
// startTime — which is what alerting keys off.
//
// Operational state local to the facility — DO_NOT_SYNC, and excluded from change
// logging (see services/migrations/constants.ts). Kept indefinitely.
export class SyncFacilityRun extends Model {
  declare id: string;
  declare status: string;
  declare startTime: Date;
  declare persistStartedAt?: Date;
  declare persistCompletedAt?: Date;
  declare completedAt?: Date;
  declare sessionId?: string;
  declare triggerType?: string;
  declare urgent: boolean;
  declare error?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: SYNC_FACILITY_RUN_STATUSES.RUNNING,
          validate: { isIn: [Object.values(SYNC_FACILITY_RUN_STATUSES)] },
        },
        startTime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        persistStartedAt: { type: DataTypes.DATE, allowNull: true },
        persistCompletedAt: { type: DataTypes.DATE, allowNull: true },
        completedAt: { type: DataTypes.DATE, allowNull: true },
        sessionId: { type: DataTypes.TEXT, allowNull: true },
        // What asked for the sync (`scheduled`, `userRequested`, ...). Only the
        // type is kept: the rest of the trigger reason can identify users or
        // patients.
        triggerType: { type: DataTypes.TEXT, allowNull: true },
        urgent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        error: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [
          { name: 'sync_facility_runs_start_time', fields: ['start_time'] },
          { name: 'sync_facility_runs_status_start_time', fields: ['status', 'start_time'] },
        ],
      },
    );
  }

  async complete(status: string, { error }: { error?: string } = {}) {
    await this.update({ status, completedAt: new Date(), error });
  }
}
