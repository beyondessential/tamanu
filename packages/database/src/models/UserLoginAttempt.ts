import { SYNC_DIRECTIONS, SETTING_KEYS, LOGIN_ATTEMPT_OUTCOMES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import { DataTypes, Sequelize, Op } from 'sequelize';
import { ReadSettings } from '@tamanu/settings';
import type { SettingPath } from '@tamanu/settings/types';

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
    this.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      as: 'device',
    });
  }

  static async checkIsUserLockedOut({
    settings,
    userId,
    deviceId = '',
  }: UserLoginAttemptMethodParams) {
    const { lockoutDuration } = (await settings.get(
      SETTING_KEYS.SECURITY_LOGIN_ATTEMPTS as SettingPath,
    )) as { lockoutDuration: number };

    const lockedAttempt = await this.findOne({
      where: {
        userId,
        deviceId,
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

    const failedAttempts = (await this.count({
      where: {
        userId,
        deviceId,
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
    const loginAttempt = await this.create({
      userId,
      deviceId,
      outcome,
    });

    return {
      loginAttempt,
      lockoutDuration: lockoutDuration * 60,
      remainingAttempts: Math.max(0, lockoutThreshold - failedAttempts - 1),
    };
  }
}
