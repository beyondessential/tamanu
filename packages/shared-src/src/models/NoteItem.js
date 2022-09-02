import { Sequelize } from 'sequelize';

import { Model } from './Model';

export class NoteItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        revisedById: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
          defaultValue: '',
        },
        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        ...options,
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
      as: 'notePages',
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
}
