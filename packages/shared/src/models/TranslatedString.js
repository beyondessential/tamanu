import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { DataTypes } from 'sequelize';
import { Model } from './Model';
import { translate } from '../utils/translation/translationFactory';

export class TranslatedString extends Model {
  static init(options) {
    super.init(
      {
        id: {
          // translated_string records use a generated primary key that enforces one per string and language,
          type: `TEXT GENERATED ALWAYS AS ("string_id" || ';' || "language") STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
        },
        stringId: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
          validate: {
            doesNotContainIdDelimiter: value => {
              if (value.includes(';')) {
                throw new Error('Translation ID cannot contain ";"');
              }
            },
          },
        },
        language: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
          validate: {
            doesNotContainIdDelimiter: value => {
              if (value.includes(';')) {
                throw new Error('Language cannot contain ";"');
              }
            },
          },
        },
        text: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          {
            name: 'string_language_unique',
            fields: ['string_id', 'language'],
            unique: true,
          },
          {
            name: 'string_id_index',
            fields: ['string_id'],
          },
          {
            name: 'language_index',
            fields: ['language'],
          },
          {
            name: 'updated_at_sync_tick_index',
            fields: ['language', 'updated_at_sync_tick'],
          },
        ],
      },
    );
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static getPossibleLanguages = async () => {
    const languagesInDb = await TranslatedString.findAll({
      attributes: ['language'],
      group: 'language',
    });

    const languageNames = await TranslatedString.findAll({
      where: { stringId: 'languageName' },
    });

    return { languagesInDb, languageNames };
  };

  /**
   *
   * @param {string} language
   * @param {string} stringId
   */
  static getTranslationFunction = language => {
    /**
     * @param {string} stringId
     * @param {string} fallback
     * @param {Record<string, unknown} replacements
     */
    return async (stringId, fallback, replacements) => {
      const text = await TranslatedString.findOne({
        where: { language, stringId },
        attributes: ['text'],
      }).then(record => record?.text);

      const value = translate(text, fallback, replacements);
      return value;
    };
  };
}
