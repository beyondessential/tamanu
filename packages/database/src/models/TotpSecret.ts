import { DataTypes, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

/**
 * A user's TOTP seed.
 *
 * The seed is a symmetric secret: anywhere it exists can mint valid codes, and
 * it cannot be hashed (verification needs the literal value). It therefore
 * lives only on central (DO_NOT_SYNC) and is verified only there — facilities
 * forward entered codes to central rather than receiving the seed.
 *
 * The secret column holds an encryptSecret() envelope (`S1:{iv}:{ciphertext}`,
 * keyed by `crypto.settingsPsk`), never plaintext. One seed per user;
 * re-enrolling replaces it. A seed is pending until `confirmedAt` is set by the
 * user entering a valid code, and only confirmed seeds count at login.
 */
export class TotpSecret extends Model {
  declare id: string;
  declare secret: string;
  declare confirmedAt?: Date;
  declare userId: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        secret: { type: DataTypes.TEXT, allowNull: false },
        confirmedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  isConfirmed() {
    return Boolean(this.confirmedAt);
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'user',
    });
  }
}
