import { SYNC_DIRECTIONS, SETTING_KEYS, LOGIN_ATTEMPT_OUTCOMES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import { DataTypes, Sequelize, Op } from 'sequelize';
import { ReadSettings } from '@tamanu/settings';
import type { SettingPath } from '@tamanu/settings/types';
import { log } from '@tamanu/shared/services/logging';

interface UserLoginAttemptMethodParams {
  settings: ReadSettings;
  userId: string;
  deviceId?: string;
}

export class UserLoginAttempt extends Model {
  declare id: string;
  declare outcome: string;
  declare userId: string;
  declare deviceId: string | null;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        outcome: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      } as any,
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  // If the deviceId is not found in the devices table, we will use null
  // for the deviceId to avoid credential stuffing from unregistered devices.
  static async getDeviceIdToUse(deviceId: string) {
    const device = await this.sequelize.models.Device.findByPk(deviceId);
    return device ? deviceId : null;
  }

  static async checkIsUserLockedOut({
    settings,
    userId,
    deviceId = '',
  }: UserLoginAttemptMethodParams) {
    const { lockoutDuration } = (await settings.get(
      SETTING_KEYS.SECURITY_LOGIN_ATTEMPTS as SettingPath,
    )) as { lockoutDuration: number };

    const deviceIdToUse = await this.getDeviceIdToUse(deviceId);

    const lockedAttempt = await this.findOne({
      where: {
        userId,
        deviceId: deviceIdToUse,
        outcome: LOGIN_ATTEMPT_OUTCOMES.LOCKED,
        createdAt: {
          [Op.gte]: Sequelize.literal("CURRENT_TIMESTAMP - $lockoutDuration * interval '1 minute'"),
        },
      },
      order: [['createdAt', 'DESC']],
      bind: {
        lockoutDuration,
      },
    });

    const createdAt = lockedAttempt?.createdAt?.getTime() ?? 0;
    const remainingLockout = lockoutDuration * 60 - Math.floor((Date.now() - createdAt) / 1000);

    return {
      isUserLockedOut: !!lockedAttempt,
      remainingLockout: Math.max(0, remainingLockout),
    };
  }

  static async createFailedLoginAttempt({
    settings,
    userId,
    deviceId = '',
  }: UserLoginAttemptMethodParams) {
    const { lockoutThreshold, observationWindow, lockoutDuration } = (await settings.get(
      SETTING_KEYS.SECURITY_LOGIN_ATTEMPTS as SettingPath,
    )) as { lockoutThreshold: number; observationWindow: number; lockoutDuration: number };

    const deviceIdToUse = await this.getDeviceIdToUse(deviceId);

    const failedAttempts = (await this.count({
      where: {
        userId,
        deviceId: deviceIdToUse,
        outcome: LOGIN_ATTEMPT_OUTCOMES.FAILED,
        createdAt: {
          [Op.gte]: Sequelize.literal(
            "CURRENT_TIMESTAMP - $observationWindow * interval '1 minute'",
          ),
        },
      },
      // @ts-ignore - sequelize doesn't know bind works in count
      bind: {
        observationWindow,
      },
    })) as unknown as number;

    // We need to add 1 to the failed attempts because the current attempt is not included in the count
    const outcome = failedAttempts + 1 >= lockoutThreshold ? LOGIN_ATTEMPT_OUTCOMES.LOCKED : LOGIN_ATTEMPT_OUTCOMES.FAILED;

    let loginAttempt = null;
    try {
      loginAttempt = await this.create({
        userId,
        deviceId: deviceIdToUse,
        outcome,
      });
    } catch (error) {
      log.error('Error creating failed login attempt', error);
    }

    return {
      loginAttempt,
      lockoutDuration: lockoutDuration * 60,
      remainingAttempts: Math.max(0, lockoutThreshold - failedAttempts - 1),
    };
  }
}
