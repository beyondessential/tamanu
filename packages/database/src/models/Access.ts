import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class Access extends Model {
  declare id: string;
  declare userId: string;
  declare recordId: string;
  declare facilityId?: string;
  declare sessionId: string;
  declare loggedAt: string;
  declare frontEndContext: string;
  declare backEndContext: string;
  declare isMobile: boolean;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        loggedAt: {
          type: DataTypes.DATETIMESTRING,
          allowNull: false,
        },
        frontEndContext: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        backEndContext: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        recordId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        recordType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        sessionId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        deviceId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        isMobile: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
      },

      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC, schema: 'logs' },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }
}
