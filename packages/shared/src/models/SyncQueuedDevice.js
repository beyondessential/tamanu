import { DataTypes, Op } from 'sequelize';
import { subMinutes } from 'date-fns';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

// TODO: config?
const SYNC_QUEUE_WINDOW_MINUTES = 5;  // you're welcome window minutes 

const SYNC_QUEUE_STATUSES = {
  QUEUED: 'queued',
  READY: 'ready',
};

export class SyncQueuedDevice extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        lastSeenTime: { type: DataTypes.DATE },
        facilityId: { type: DataTypes.TEXT },
        lastSyncedTick: { type: DataTypes.BIGINT },
        urgent: { type: DataTypes.TEXT },
        status: { 
          type: DataTypes.TEXT,
          default: SYNC_QUEUE_STATUSES.QUEUED,
        },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  static async getNextDevice() {
    const now = toDateTimeString(subMinutes(new Date(), SYNC_QUEUE_WINDOW_MINUTES));
    return this.find({
      limit: 1,
      where: {
        lastSeenTime: {
          [Op.gt]: now,
          status: SYNC_QUEUE_STATUSES.READY,
        },
      },
      orderBy: [
        ['urgent', 'DESC'], // trues first
        ['lastSyncedTick', 'ASC'], // oldest sync first
      ],
    });
  }

  static async processQueue() {
    if (await this.getNextDevice()) return;

    return this.update({
      status: SYNC_QUEUE_STATUSES.READY,
    }, {
      where: {
        status: SYNC_QUEUE_STATUSES.QUEUED,
      },
    });
  }
}
