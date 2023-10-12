import { DataTypes, Op } from 'sequelize';
import { subMinutes } from 'date-fns';

import { toDateTimeString, getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { SYNC_DIRECTIONS, SYNC_QUEUE_STATUSES } from '@tamanu/constants';
import { Model } from './Model';

// TODO: config?
const SYNC_QUEUE_WINDOW_MINUTES = 5;  // you're welcome window minutes 

export class SyncQueuedDevice extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        lastSeenTime: { type: DataTypes.DATE },
        facilityId: { type: DataTypes.TEXT },
        lastSyncedTick: { type: DataTypes.BIGINT },
        urgent: { type: DataTypes.TEXT },
        status: { 
          type: DataTypes.TEXT,
          default: SYNC_QUEUE_STATUSES.QUEUED,
        },
      },
      {
        ...options, 
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        paranoid: false,
      },
    );
  }

  static async getNextReadyDevice() {
    const windowStart = toDateTimeString(subMinutes(new Date(), SYNC_QUEUE_WINDOW_MINUTES));
    const foundDevice = await this.findOne({
      where: {
        lastSeenTime: {
          [Op.gt]: windowStart,
        },
        status: SYNC_QUEUE_STATUSES.READY,
      },
      orderBy: [
        ['urgent', 'DESC'], // trues first
        ['lastSyncedTick', 'ASC'], // oldest sync first
      ],
    });
    return foundDevice;
  }

  static async processQueue() {
    if (await this.getNextReadyDevice()) {
      // There are still devices waiting in the ready zone, so don't 
      // promote any devices from the queued zone into to the ready zone yet.
      return;
    }

    return this.update({
      status: SYNC_QUEUE_STATUSES.READY,
    }, {
      where: {
        status: SYNC_QUEUE_STATUSES.QUEUED,
      },
    });
  }

  static async checkSyncRequest({ facilityId, deviceId, urgent, lastSyncedTick }) {
    // first, update our own entry in the sync queue
    const queueRecord = await this.findByPk(deviceId);

    if (!queueRecord) {
      // new entry in sync queue
      await this.create({
        id: deviceId,
        facilityId,
        status: SYNC_QUEUE_STATUSES.QUEUED,
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

    // now check our position in the queue - if we're at the top, start a sync
    const nextDevice = await this.getNextReadyDevice();
    if (nextDevice?.id !== deviceId) {
      // someone else is in the queue before us, report back with a "wait" signal
      return false;
    }

    // it's our turn! remove our record from the queue and tell the sync system that
    // we're ready to go!
    // (if the resulting sync has an error, we'll be knocked to the back of the queue
    // but that's fine, it will leave some room for non-errored devices to sync, and 
    // our requests will get priority once our error resolves as we'll have an older
    // lastSyncedTick)
    queueRecord.destroy();
    return true;
  }

}
