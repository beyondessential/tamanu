import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';

import { Model } from './Model';
import { buildNoteItemLinkedSyncFilter } from './buildNoteLinkedSyncFilter';

export class NoteItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          ...primaryKey,
          type: DataTypes.UUID,
        },
        revisedById: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: '',
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveContent() {
            if (!this.content) {
              throw new Error('NoteItem: Content must not be empty');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.NotePage, {
      foreignKey: 'notePageId',
      as: 'notePage',
    });

    this.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author',
    });

    this.belongsTo(models.User, {
      foreignKey: 'onBehalfOfId',
      as: 'onBehalfOf',
    });
  }

  static buildSyncFilter = buildNoteItemLinkedSyncFilter;
}
