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
              throw new Error(
                `NotePage: Must have a valid record type (got ${this.recordType}), id: '${this.id}'`,
              );
            }
          },
          mustHaveValidType() {
            if (!NOTE_TYPE_VALUES.includes(this.type)) {
              throw new Error(
                `NotePage: Must have a valid note type (got ${this.type}), id: '${JSON.stringify(this)}'`,
              );
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    NOTE_RECORD_TYPE_VALUES.forEach(modelName => {
      this.belongsTo(models[modelName], {
        foreignKey: 'recordId',
        constraints: false,
      });
    });

    this.hasMany(models.NoteItem, {
      foreignKey: 'notePageId',
      as: 'noteItems',
      constraints: false,
    });
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

  static async createWithItem({ recordId, recordType, type, content, authorId }) {
    await NotePage.create({
      recordId,
      recordType,
      type,
    });

    return NoteItem.create({
      content,
      authorId,
    });
  }

  static async findPagesWithSingleItem(models, options = {}) {
    const notePages = await this.findAll({
      include: [
        ...options.includes,
        {
          model: models.NoteItem,
          as: 'noteItems',
          where: {
            revisedById: null,
          },
          limit: 1,
        },
      ],
      ...options,
    });

    return notePages
      .map(notePage => notePage.toJSON())
      .map(notePage => {
        const newNotePage = { ...notePage };
        newNotePage.content = newNotePage.noteItems[0]?.content;
        delete newNotePage.noteItems;
        return newNotePage;
      });
  }

  static async findSinglePageWithSingleItem(models, options = {}) {
    const notePage = await this.findOne({
      include: [
        ...options.includes,
        {
          model: models.NoteItem,
          as: 'noteItems',
          where: {
            revisedById: null,
          },
          limit: 1,
        },
      ],
      ...options,
    });

    const notePageJSON = notePage.toJSON();
    notePageJSON.content = notePageJSON.noteItems[0]?.content;
    delete notePageJSON.noteItems;

    return notePageJSON;
  }
}
