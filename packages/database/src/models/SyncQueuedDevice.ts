import { DataTypes, Op } from 'sequelize';
import { subMinutes } from 'date-fns';

import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

const SYNC_READY_WINDOW_MINUTES = 5;

export class SyncQueuedDevice extends Model {
  declare id: string;
  declare facilityIds: string[];
  declare lastSeenTime?: Date;
  declare lastSyncedTick?: number;
  declare urgent?: boolean;

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
    // first, update our own entry in the sync queue
    const queueRecord = await this.findByPk(id);

    if (!queueRecord) {
      // new entry in sync queue
      await this.create({
        id,
        facilityIds: JSON.stringify(facilityIds),
        lastSeenTime: getCurrentDateTimeString(),
        urgent,
        lastSyncedTick,
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
