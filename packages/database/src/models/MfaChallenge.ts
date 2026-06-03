import { DataTypes, Sequelize } from 'sequelize';
import { MFA_CHALLENGE_TYPES, SYNC_DIRECTIONS, type MfaChallengeType } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

/**
 * Ephemeral single-use MFA tokens, following the OneTimeLogin pattern:
 *
 * - WebAuthn ceremony challenges (registration and assertion nonces), issued
 *   and verified by whichever server runs the ceremony — never synced, so
 *   in-zone WebAuthn works fully offline at a facility.
 * - Admin-issued enrolment invite tokens (remote/async provisioning).
 *   Redemption additionally requires the user's password — the token alone is
 *   never sufficient, as it would otherwise be a bearer authorisation to enrol
 *   an attacker's own authenticator.
 */
export class MfaChallenge extends Model {
  declare id: string;
  declare type: MfaChallengeType;
  declare token: string;
  declare expiresAt: Date;
  declare usedAt?: Date;
  declare userId?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        type: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            isIn: [Object.values(MFA_CHALLENGE_TYPES)],
          },
        },
        token: { type: DataTypes.TEXT, allowNull: false },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
        usedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  isExpired() {
    return this.expiresAt < new Date();
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        // nullable: usernameless WebAuthn assertion challenges are issued
        // before the user is known
        allowNull: true,
      },
      as: 'user',
    });
  }
}
