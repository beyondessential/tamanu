import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class AskAiConversation extends Model {
  declare id: string;
  declare userId: string;
  declare title: string | null;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        userId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        title: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        ...options,
        tableName: 'conversations',
        schema: 'ask_ai',
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    this.hasMany(models.AskAiMessage, {
      foreignKey: 'conversationId',
      as: 'messages',
    });
  }
}
