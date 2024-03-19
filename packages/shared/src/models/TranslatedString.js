import {
  SYNC_DIRECTIONS,
  ENGLISH_LANGUAGE_CODE,
  REFERENCE_DATA_TRANSLATION_PREFIX,
} from '@tamanu/constants';
import { DataTypes, Op } from 'sequelize';
import { Model } from './Model';

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

  static getReferenceDataTranslationsByDataType = async ({
    language = ENGLISH_LANGUAGE_CODE,
    refDataType,
    queryString = '',
  }) => {
    return this.findAll({
      where: {
        language: language,
        stringId: {
          [Op.startsWith]: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${refDataType}`,
        },
        text: {
          [Op.iLike]: `%${queryString}%`,
        },
      },
      attributes: ['stringId', 'text'],
      raw: true
    });
  };
}
