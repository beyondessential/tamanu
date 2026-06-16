import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model.ts';
import type { InitOptions, Models } from '../types/model.ts';

/**
 * An async AI form-builder chat job and its result.
 *
 * Central-only and non-syncing. Persisted (rather than held in memory) so the
 * result is visible to every central process and survives a restart — a polling
 * client always resolves the job that started its request. Ephemeral:
 * {@link expiresAt} bounds the lifetime and FormBuilderChatCleaner purges
 * expired rows.
 */
export class FormBuilderChatJob extends Model {
  declare id: string;
  declare userId: string;
  declare status: string;
  declare result?: Record<string, unknown> | null;
  declare error?: Record<string, unknown> | null;
  declare expiresAt: Date;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        status: { type: DataTypes.TEXT, allowNull: false },
        result: { type: DataTypes.JSONB, allowNull: true },
        error: { type: DataTypes.JSONB, allowNull: true },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, { foreignKey: 'userId' });
  }
}
