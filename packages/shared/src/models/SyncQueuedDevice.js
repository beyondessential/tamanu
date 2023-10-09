import { DataTypes, Op } from 'sequelize';
import { subMinutes } from 'date-fns';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

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

  static async getNextDevice() {
    const windowStart = toDateTimeString(subMinutes(new Date(), SYNC_QUEUE_WINDOW_MINUTES));
    console.log("now", windowStart);
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
    if (await this.getNextDevice()) {
      // TODO: expire old devices
      console.log("Still devices ready");
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
}
