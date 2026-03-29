import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class AskAiMessage extends Model {
  declare id: string;
  declare conversationId: string;
  declare role: 'user' | 'assistant';
  declare content: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        conversationId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: { tableName: 'conversations', schema: 'ask_ai' },
            key: 'id',
          },
        },
        role: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'user | assistant',
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        tableName: 'messages',
        schema: 'ask_ai',
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        paranoid: false,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.AskAiConversation, {
      foreignKey: 'conversationId',
      as: 'conversation',
    });
  }
}
