import { DataTypes, Op } from 'sequelize';
import { subMinutes } from 'date-fns';

import { toDateTimeString, getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { SYNC_DIRECTIONS, SYNC_QUEUE_STATUSES } from '@tamanu/constants';
import { Model } from './Model';

// TODO: config?
const SYNC_QUEUE_WINDOW_MINUTES = 5;

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
        lastSyncedTick: { type: DataTypes.BIGINT },
        urgent: { type: DataTypes.BOOLEAN },
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

  static initRelations(models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }

  static getQueueWhereClause() {
    return {
      lastSeenTime: {
        [Op.gt]: toDateTimeString(subMinutes(new Date(), SYNC_QUEUE_WINDOW_MINUTES)),
      },
      status: SYNC_QUEUE_STATUSES.READY,
    };
  }

  static async getNextReadyDevice() {
    return this.findOne({
      where: this.getQueueWhereClause(),
      orderBy: [
        ['urgent', 'DESC'], // trues first
        ['lastSyncedTick', 'ASC'], // oldest sync first
      ],
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
      return null;
    }

    // it's our turn! tell the sync system that we're ready to go!
    return queueRecord;
  }
}
