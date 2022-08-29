import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';
import { NoteItem } from './NoteItem';
import { NOTE_RECORD_TYPE_VALUES, NOTE_TYPE_VALUES } from '../constants';

export class NotePage extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        // we can't use a sequelize-generated relation here
        // as the FK can link to one of many different tables
        type: {
          type: Sequelize.STRING,
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
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
        validate: {
          mustHaveValidRelationType() {
            if (!NOTE_RECORD_TYPE_VALUES.includes(this.recordType)) {
              throw new Error(`NotePage: Must have a valid record type (got ${this.recordType})`);
            }
          },
          mustHaveValidType() {
            if (!NOTE_TYPE_VALUES.includes(this.type)) {
              throw new Error(`NotePage: Must have a valid note type (got ${this.type})`);
            }
          },
        },
      },
    );
  }

  static async createForRecord(record, type, content) {
    await NotePage.create({
      recordId: record.id,
      recordType: record.getModelName(),
      type,
    });

    return NoteItem.create({
      content,
    });
  }

  static initRelations(models) {
    NOTE_RECORD_TYPE_VALUES.forEach(modelName => {
      this.belongsTo(models[modelName], {
        foreignKey: 'recordId',
        constraints: false,
      });
    });
  }
}
