import { DataTypes, Op } from 'sequelize';
import { subMinutes } from 'date-fns';

import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

const SYNC_READY_WINDOW_MINUTES = 5;
const CONSECUTIVE_FAILURES_LOOKBACK_LIMIT = 100;

export class SyncQueuedDevice extends Model {
  declare id: string;
  declare facilityIds: string[];
  declare lastSeenTime?: Date;
  declare lastSyncedTick?: number;
  declare urgent?: boolean;
  declare consecutiveFailures: number;

  static initModel(options: InitOptions) {
    super.init(
      {
        // this represents the deviceId of the queued device (ie it's not randomly generated)
        id: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        facilityIds: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        lastSeenTime: { type: DataTypes.DATE },
        lastSyncedTick: { type: DataTypes.BIGINT },
        urgent: { type: DataTypes.BOOLEAN },
        consecutiveFailures: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        paranoid: false,
      },
    );
  }
  static getReadyDevicesWhereClause() {
    return {
      lastSeenTime: {
        [Op.gt as symbol]: toDateTimeString(subMinutes(new Date(), SYNC_READY_WINDOW_MINUTES)),
      },
    };
  }

  static async getNextReadyDevice() {
    return await this.findOne({
      where: this.getReadyDevicesWhereClause(),
      order: [
        ['urgent', 'DESC'], // trues first
        ['consecutiveFailures', 'ASC'], // healthy devices first
        ['lastSyncedTick', 'ASC'], // oldest sync first
      ],
    });
  }

  static async checkSyncRequest(
    id: string,
    {
      facilityIds,
      urgent,
      lastSyncedTick,
    }: {
      facilityIds: string[];
      urgent: boolean;
      lastSyncedTick: number;
    },
  ) {
    const queueRecord = await this.findByPk(id);

    if (!queueRecord) {
      // New entry: compute consecutive failures from sync_sessions (only needed on create;
      // once in the queue we keep the cached value to avoid a heavy query on every poll)
      const [result] = await this.sequelize.query<{ consecutive_failures: number }>(
        `
        WITH ranked_sessions AS (
          SELECT 
            ROW_NUMBER() OVER (ORDER BY completed_at DESC) as rn,
            CASE WHEN errors IS NOT NULL AND array_length(errors, 1) > 0 
              THEN TRUE ELSE FALSE 
            END as has_error
          FROM sync_sessions
          WHERE parameters @> jsonb_build_object('deviceId', :deviceId)
            AND completed_at IS NOT NULL
          ORDER BY completed_at DESC
          LIMIT :limit
        )
        SELECT COUNT(*)::INTEGER as consecutive_failures
        FROM ranked_sessions
        WHERE has_error = TRUE 
          AND rn < COALESCE(
            (SELECT MIN(rn) FROM ranked_sessions WHERE has_error = FALSE), 
            :limit + 1
          )
        `,
        {
          replacements: { deviceId: id, limit: CONSECUTIVE_FAILURES_LOOKBACK_LIMIT },
        },
      );
      const consecutiveFailures = result[0]?.consecutive_failures || 0;
      await this.create({
        id,
        facilityIds: JSON.stringify(facilityIds),
        lastSeenTime: getCurrentDateTimeString(),
        urgent,
        lastSyncedTick,
        consecutiveFailures,
      });
    } else {
      // update with most recent info
      // (always go with most urgent request - this way a user-requested urgent
      // sync won't be overwritten to non-urgent by a scheduled sync)
      await queueRecord.update({
        lastSeenTime: getCurrentDateTimeString(),
        urgent: urgent || queueRecord.urgent,
        lastSyncedTick,
      });
    }

    // now check the queue and return the top device - if it's us, the handler will
    // start a sync (otherwise it'll get used in a "waiting behind device X" response
    return await this.getNextReadyDevice();
  }
}
