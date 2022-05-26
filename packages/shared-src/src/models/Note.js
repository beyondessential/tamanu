import { Sequelize } from 'sequelize';
import { Model } from './Model';

export const NOTE_RECORD_TYPES = {
  ENCOUNTER: 'Encounter',
  PATIENT: 'Patient',
  TRIAGE: 'Triage',
  PATIENT_CARE_PLAN: 'PatientCarePlan',
  LAB_REQUEST: 'LabRequest',
  IMAGING_REQUEST: 'ImagingRequest',
};

const NOTE_RECORD_TYPE_VALUES = Object.values(NOTE_RECORD_TYPES);

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
          type: Sequelize.STRING,
          allowNull: false,
        },

        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        noteType: {
          type: Sequelize.STRING,
          allowNull: false,
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
      as: 'author',
    });

    this.belongsTo(models.User, {
      foreignKey: 'onBehalfOfId',
      as: 'onBehalfOf',
    });

    NOTE_RECORD_TYPE_VALUES.forEach(modelName => {
      this.belongsTo(models[modelName], {
        foreignKey: 'recordId',
        constraints: false,
      });
    });
  }

  getParentRecord(options) {
    if (!this.recordType) return Promise.resolve(null);
    const parentGetter = `get${this.recordType}`;
    return this[parentGetter](options);
  }
}
