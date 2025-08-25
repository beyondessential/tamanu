import { DataTypes, Op, Sequelize } from 'sequelize';
import {
  DEVICE_SCOPES,
  DEVICE_SCOPES_SUBJECT_TO_QUOTA,
  SYNC_DIRECTIONS,
  type DeviceScope,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class Device extends Model {
  declare id: string;
  declare lastSeenAt: Date;
  declare registeredById: string;
  declare scopes: DeviceScope[];
  declare name?: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        lastSeenAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
        scopes: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        name: {
          type: DataTypes.TEXT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        validate: {
          mustHaveKnownScopes() {
            if (
              // `as` necessary because of incomplete typings in sequelize
              (this.scopes as DeviceScope[]).some(
                scope => !Object.values(DEVICE_SCOPES).includes(scope),
              )
            ) {
              throw new InvalidOperationError('Device must only use known scopes.');
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'registeredById',
      as: 'registeredBy',
    });
  }

  static async getQuotaByUserId(userId: string) {
    return this.count({
      where: {
        registeredById: userId,
        [Op.or]: DEVICE_SCOPES_SUBJECT_TO_QUOTA.map(scope =>
          Sequelize.literal(`scopes ? '${scope}'`),
        ),
      },
    });
  }

  async markSeen(): Promise<void> {
    await this.update({
      lastSeenAt: Sequelize.fn('now'),
    });
  }

  requiresQuota(): boolean {
    return this.scopes.some(scope => DEVICE_SCOPES_SUBJECT_TO_QUOTA.includes(scope));
  }
}
