import config from 'config';
import { DataTypes, Op, type FindOptions } from 'sequelize';
import {
  COMMUNICATION_STATUSES,
  COMMUNICATION_STATUSES_VALUES,
  PATIENT_COMMUNICATION_CHANNELS_VALUES,
  PATIENT_COMMUNICATION_TYPES_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class PatientCommunication extends Model {
  declare id: string;
  declare type: (typeof PATIENT_COMMUNICATION_TYPES_VALUES)[number];
  declare channel: (typeof PATIENT_COMMUNICATION_CHANNELS_VALUES)[number];
  declare subject?: string;
  declare content?: string;
  declare status: (typeof COMMUNICATION_STATUSES_VALUES)[number];
  declare error?: string;
  declare retryCount?: number;
  declare destination?: string;
  declare attachment?: string;
  declare hash?: number;
  declare patientId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        type: { type: DataTypes.ENUM(...PATIENT_COMMUNICATION_TYPES_VALUES), allowNull: false },
        channel: {
          type: DataTypes.ENUM(...PATIENT_COMMUNICATION_CHANNELS_VALUES),
          allowNull: false,
        },
        subject: DataTypes.TEXT,
        content: DataTypes.TEXT,
        status: {
          type: DataTypes.ENUM(...COMMUNICATION_STATUSES_VALUES),
          allowNull: false,
          defaultValue: COMMUNICATION_STATUSES.QUEUED,
        },
        error: DataTypes.TEXT,
        retryCount: DataTypes.INTEGER,
        destination: DataTypes.STRING,
        attachment: DataTypes.STRING,
        hash: DataTypes.INTEGER,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }

  static getBaseQueryPendingMessage(channel: InstanceType<typeof PatientCommunication>['channel']) {
    const threshold = config.patientCommunication?.retryThreshold;

    return {
      where: {
        status: COMMUNICATION_STATUSES.QUEUED,
        channel,
        [Op.or as symbol]: [
          { retryCount: { [Op.lte as symbol]: threshold } },
          { retryCount: null },
        ],
      },
    };
  }

  static getPendingMessages(
    channel: InstanceType<typeof PatientCommunication>['channel'],
    queryOptions: FindOptions<any> | undefined,
  ) {
    return this.findAll({
      ...this.getBaseQueryPendingMessage(channel),
      order: [
        [this.sequelize.literal('retry_count IS NULL'), 'DESC'],
        ['retryCount', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      ...queryOptions,
    });
  }

  static countPendingMessages(channel: InstanceType<typeof PatientCommunication>['channel']) {
    return this.count(this.getBaseQueryPendingMessage(channel));
  }
}
