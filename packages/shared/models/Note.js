import { Sequelize } from 'sequelize';
import { Model } from './Model';

import { Visit } from './Visit';
import { Patient } from './Patient';

const OBJECT_TYPES = [
  Visit,
  Patient,
].map(modelClass => modelClass.name);

export class Note extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        // we can't use a sequelize-generated relation here
        // as the FK can link to one of many different tables
        objectId: {
          type: primaryKey.type,
          allowNull: false,
        },
        objectType: {
          type: Sequelize.ENUM(OBJECT_TYPES),
          allowNull: false,
        },

        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
          defaultValue: '',
        },
      },
      {
        ...options,
        validate: {
          mustHaveValidRelationType() {
            if (!OBJECT_TYPES.includes(this.objectType)) {
              throw new Error(`Must have a valid type (got ${this.objectType})`);
            }
          },
          mustHaveContent() {
            if (this.content === '') {
              throw new Error('Content must not be empty');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'authorId',
    });
  }
}
