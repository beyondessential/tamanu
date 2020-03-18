import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { NOTE_TYPES } from 'shared/constants';

export const NOTE_OBJECT_TYPES = {
  VISIT: 'Visit',
  PATIENT: 'Patient',
  TRIAGE: 'Triage',
};

const NOTE_OBJECT_TYPE_VALUES = Object.values(NOTE_OBJECT_TYPES);
const NOTE_TYPE_VALUES = Object.values(NOTE_TYPES);

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
          type: Sequelize.ENUM(NOTE_OBJECT_TYPE_VALUES),
          allowNull: false,
        },

        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        noteType: {
          type: Sequelize.ENUM(NOTE_TYPE_VALUES),
          allowNull: false,
          defaultValue: '',
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
            if (!NOTE_OBJECT_TYPE_VALUES.includes(this.objectType)) {
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

  static createForObject(object, noteType, content) {
    return Note.create({
      objectId: object.id,
      objectType: object.getModelName(),
      noteType,
      content,
    });
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'authorId',
    });
  }
}
