import { DataTypes, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class SyncDevice extends Model {
  declare id: string;
  declare lastSeenAt: Date;
  declare deviceId: string;
  declare registeredById: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        lastSeenAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
        deviceId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'registeredById',
      as: 'registeredBy',
    });
  }

  async markSeen() {
    await this.update({
      lastSeenAt: Sequelize.fn('now'),
    });
  }
}
