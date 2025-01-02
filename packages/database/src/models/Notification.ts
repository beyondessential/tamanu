import { DataTypes } from 'sequelize';
import config from 'config';
import { SYNC_DIRECTIONS, NOTIFICATION_TYPES, NOTIFICATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { log } from '@tamanu/shared/services/logging';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPES);
const NOTIFICATION_STATUS_VALUES = Object.values(NOTIFICATION_STATUSES);

export class Notification extends Model {
  declare id: string;
  declare type: (typeof NOTIFICATION_TYPE_VALUES)[number];
  declare status: (typeof NOTIFICATION_STATUS_VALUES)[number];
  declare createdTime?: string;
  declare metadata: Record<string, any>;
  declare userId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        type: {
          type: DataTypes.ENUM(...NOTIFICATION_TYPE_VALUES),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(...NOTIFICATION_STATUS_VALUES),
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
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
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

  static async pushNotification(
    type: (typeof NOTIFICATION_TYPE_VALUES)[number],
    metadata: Record<string, any>,
  ) {
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

      if (!patientId || !userId) {
        return;
      }

      await this.create({
        type,
        metadata: { ...metadata, patientId },
        userId,
        createdTime: getCurrentDateTimeString(),
      });
    } catch (error) {
      log.error('Error pushing notification', error);
    }
  }
}
