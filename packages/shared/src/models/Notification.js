import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, NOTIFICATION_TYPES, NOTIFICATION_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { log } from '../services/logging';
import config from 'config';

export class Notification extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        type: {
          type: DataTypes.ENUM(Object.values(NOTIFICATION_TYPES)),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(Object.values(NOTIFICATION_STATUSES)),
          defaultValue: NOTIFICATION_STATUSES.UNREAD,
          allowNull: false,
        },
        createdTime: dateTimeType('createdTime', {
          allowNull: true,
        }),
        metadata: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
      },
      {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        ...options,
      },
    );
  }

  /**
   *
   * @param {import('./')} models
   */
  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  static getFullReferenceAssociations() {
    const { models } = this.sequelize;

    return [
      {
        model: models.User,
        as: 'user',
        attributes: ['id', 'displayName'],
      },
      {
        model: models.Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'middleName', 'lastName', 'displayId'],
      },
    ];
  }

  static async pushNotification(type, metadata) {
    try {
      if (!config.notification?.enabled) return;

      const { models } = this.sequelize;

      let patientId;
      let userId;
      switch (type) {
        case NOTIFICATION_TYPES.IMAGING_REQUEST: {
          userId = metadata.requestedById;
          const encounter = await models.Encounter.findByPk(metadata.encounterId);
          patientId = encounter?.patientId;
          break;
        }
        case NOTIFICATION_TYPES.LAB_REQUEST: {
          userId = metadata.requestedById;
          const encounter = await models.Encounter.findByPk(metadata.encounterId);
          patientId = encounter?.patientId;
          break;
        }
        default:
          return;
      }

      await models.Notification.create({
        type,
        metadata,
        userId,
        patientId,
        createdTime: getCurrentDateTimeString(),
      });
    } catch (error) {
      log.error('Error pushing notification', error);
    }
  }
}
