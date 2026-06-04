import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { type InitOptions } from '../types/model';

export interface AiChatMessage {
  role: 'system' | 'human' | 'ai';
  content: string;
}

/**
 * A multi-turn AI conversation transcript (currently used by the form builder).
 *
 * Central-only and non-syncing. Sessions are ephemeral: {@link expiresAt}
 * bounds their lifetime and FormBuilderChatCleaner purges expired rows.
 */
export class AiChatSession extends Model {
  declare id: string;
  declare contextName: string;
  declare messages: AiChatMessage[];
  declare expiresAt: Date;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        contextName: { type: DataTypes.TEXT, allowNull: false },
        messages: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }
}
