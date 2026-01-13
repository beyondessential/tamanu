import { difference } from 'lodash';
import { DataTypes, Op, Sequelize, Transaction } from 'sequelize';
import {
  DEVICE_REGISTRATION_PERMISSION,
  DEVICE_SCOPES,
  DEVICE_SCOPES_SUBJECT_TO_QUOTA,
  SETTING_KEYS,
  SYNC_DIRECTIONS,
  type DeviceScope,
} from '@tamanu/constants';
import {
  AuthPermissionError,
  InvalidOperationError,
  MissingCredentialError,
  QuotaExceededError,
} from '@tamanu/errors';
import { Model } from './Model';
import type { ReadSettings } from '@tamanu/settings';
import type { SettingPath } from '@tamanu/settings/types';
import type { User } from './User';
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
          // the jsonb operator `?`: "Does the string exist as a top-level key within the JSON value?"
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

  ensureHasScope(scope: DeviceScope) {
    if (!this.scopes.includes(scope)) {
      throw new Error('Device must have the required scope.');
    }
  }

  static async ensureRegistration({
    settings,
    user,
    deviceId,
    scopes,
  }: EnsureRegistrationParams): Promise<Device | undefined> {
    // There's two race conditions we seek to avoid with this transaction:
    //
    // 1. If the device logs in to the server twice simultaneously, we want
    //    to avoid two SyncDevice records being created. This is also mitigated
    //    by the UNIQUE constraint on the table.
    //
    // 2. If two unknown devices try to register at the same time, and the
    //    quota is reached on the first one, the second should not be able to.
    return await Device.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async () => {
        if (!deviceId) {
          if (scopes.includes(DEVICE_SCOPES.SYNC_CLIENT)) {
            throw new MissingCredentialError('Device ID is required');
          } else {
            return;
          }
        }

        const syncDevice = await Device.findByPk(deviceId);
        if (syncDevice) {
          if (difference(scopes, syncDevice.scopes).length > 0) {
            throw new AuthPermissionError('Requested more scopes than the device has');
          }

          await syncDevice.markSeen();
          return syncDevice;
        }

        const device = new Device({
          id: deviceId,
          registeredById: user.id,
          scopes,
        });

        const deviceRegistrationEnabled = await settings.get(
          SETTING_KEYS.FEATURES_DEVICE_REGISTRATION_ENABLED as SettingPath,
        );

        if (deviceRegistrationEnabled && device.requiresQuota()) {
          const permission = user.deviceRegistrationPermission;

          if (permission === DEVICE_REGISTRATION_PERMISSION.UNLIMITED) {
            // Unlimited permission: allow registration
          } else if (permission === DEVICE_REGISTRATION_PERMISSION.SINGLE) {
            const currentCount = await Device.getQuotaByUserId(user.id);
            if (currentCount >= 1) {
              throw new QuotaExceededError();
            }
          } else {
            // NONE or any unrecognized value: fail closed
            throw new QuotaExceededError();
          }
        }

        await device.save();
        return device;
      },
    );
  }
}

export interface EnsureRegistrationParams {
  settings: ReadSettings;
  user: User;
  deviceId?: string;
  scopes: string[];
}
