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
      // New entry: compute consecutive failures from sync_sessions (only needed on create)
      const queryResult = await this.sequelize.query(
        `
        WITH latest_sessions AS (
          SELECT parameters, errors, completed_at
          FROM sync_sessions
          WHERE completed_at IS NOT NULL
          ORDER BY completed_at DESC
          LIMIT :lookback_limit
        ),
        recent AS (
          SELECT
            errors,
            ROW_NUMBER() OVER (ORDER BY completed_at DESC) AS row_number
          FROM latest_sessions
          WHERE parameters->>'deviceId' = :id
        )
        SELECT count(*)::int AS consecutive_failures
        FROM recent
        WHERE row_number < COALESCE(
          (SELECT MIN(row_number) FROM recent WHERE errors IS NULL OR array_length(errors, 1) IS NULL),
          (SELECT count(*) FROM recent) + 1
        )
        `,
        {
          replacements: { id, lookback_limit: CONSECUTIVE_FAILURES_LOOKBACK_LIMIT },
          type: 'SELECT',
        },
      );
      const failureCountResult = queryResult as Array<{ consecutive_failures: number }>;
      const consecutiveFailures = failureCountResult[0]?.consecutive_failures ?? 0;
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
