import { Sequelize } from 'sequelize';
import { NOTE_TYPES } from 'shared/constants';
import { Model } from './Model';

export const NOTE_RECORD_TYPES = {
  ENCOUNTER: 'Encounter',
  PATIENT: 'Patient',
  TRIAGE: 'Triage',
};

const NOTE_RECORD_TYPE_VALUES = Object.values(NOTE_RECORD_TYPES);
const NOTE_TYPE_VALUES = Object.values(NOTE_TYPES);

export class Note extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        // we can't use a sequelize-generated relation here
        // as the FK can link to one of many different tables
        recordId: {
          type: primaryKey.type,
          allowNull: false,
        },
        recordType: {
          type: Sequelize.ENUM(NOTE_RECORD_TYPE_VALUES),
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
            if (!NOTE_RECORD_TYPE_VALUES.includes(this.recordType)) {
              throw new Error(`Must have a valid type (got ${this.recordType})`);
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

  static createForRecord(record, noteType, content) {
    return Note.create({
      recordId: record.id,
      recordType: record.getModelName(),
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
