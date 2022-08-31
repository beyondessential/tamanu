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
        noteType: {
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
        syncConfig: {
          syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
          includedRelations: ['noteItems'],
        },
        validate: {
          mustHaveValidRelationType() {
            if (!NOTE_RECORD_TYPE_VALUES.includes(this.recordType)) {
              throw new Error(`NotePage: Must have a valid record type (got ${this.recordType})`);
            }
          },
          mustHaveValidType() {
            if (!NOTE_TYPE_VALUES.includes(this.noteType)) {
              throw new Error(`NotePage: Must have a valid note type (got ${this.noteType})`);
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

  static async createForRecord(recordId, recordType, type, content, authorId) {
    const notePage = await NotePage.create({
      recordId,
      recordType,
      type,
      date: Date.now(),
    });

    return NoteItem.create({
      notePageId: notePage.id,
      content,
      date: Date.now(),
      authorId,
    });
  }

  /**
   * This is a util method that allows finding multiple note pages associated record that
   * should only have 1 single attached note item to the note page.
   * Eg: ImagingRequest
   * @param {*} models
   * @param {*} options
   * @returns
   */
  static async findAllWithSingleNoteItem(models, options = {}) {
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

  /**
   * This is a util method that allows finding a single note page associated record that
   * should only have 1 single attached note item to the note page.
   * Eg: ImagingRequest
   * @param {*} models
   * @param {*} options
   * @returns
   */
  static async findOneWithSingleNoteItem(models, options = {}) {
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

  async getParentRecord(options) {
    if (!this.recordType) {
      return Promise.resolve(null);
    }
    const parentGetter = `get${this.recordType}`;
    return this[parentGetter](options);
  }
}
