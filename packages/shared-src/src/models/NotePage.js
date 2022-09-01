import { Sequelize } from 'sequelize';
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

  async getCombinedNoteObject(models) {
    const noteItem = await models.NoteItem.findOne({
      include: [
        { model: models.User, as: 'author' },
        { model: models.User, as: 'onBehalfOf' },
      ],
      where: {
        notePageId: this.id,
      },
    });

    return {
      ...noteItem.toJSON(),
      id: this.id,
      recordType: this.recordType,
      recordId: this.recordId,
      noteType: this.noteType,
    };
  }

  static async createForRecord(recordId, recordType, noteType, content, authorId) {
    const notePage = await NotePage.create({
      recordId,
      recordType,
      noteType,
      date: Date.now(),
    });

    await NoteItem.create({
      notePageId: notePage.id,
      content,
      date: Date.now(),
      authorId,
    });

    return notePage;
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
        ...(options?.includes || []),
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
    return this.findOne({
      include: [
        ...(options?.includes || []),
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
  }

  async getParentRecord(options) {
    if (!this.recordType) {
      return Promise.resolve(null);
    }
    const parentGetter = `get${this.recordType}`;
    return this[parentGetter](options);
  }
}
