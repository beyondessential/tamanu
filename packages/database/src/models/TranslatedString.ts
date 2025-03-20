import {
  SYNC_DIRECTIONS,
  ENGLISH_LANGUAGE_CODE,
  DEFAULT_LANGUAGE_CODE,
  REFERENCE_DATA_TRANSLATION_PREFIX,
} from '@tamanu/constants';
import { DataTypes, Op } from 'sequelize';
import { Model } from './Model';
import { keyBy, mapValues } from 'lodash';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';
import type { InitOptions } from '../types/model';

type TranslationOptions = {
  replacements: Record<string, string>;
  casing: 'uppercase' | 'lowercase' | 'sentence';
};

export class TranslatedString extends Model {
  declare id: string;
  declare stringId: string;
  declare language: string;
  declare text: string;

  static initModel(options: InitOptions) {
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
            doesNotContainIdDelimiter: (value: string) => {
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
            doesNotContainIdDelimiter: (value: string) => {
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

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  static getPossibleLanguages = async () => {
    const languagesInDb = await TranslatedString.findAll({
      attributes: ['language'],
      group: 'language',
      where: {
        language: {
          [Op.not]: DEFAULT_LANGUAGE_CODE
        }
      }
    });

    const languageNames = await TranslatedString.findAll({
      where: { stringId: 'languageName' },
    });

    return { languagesInDb, languageNames };
  };

  static getReferenceDataTranslationsByDataType = async ({
    language = ENGLISH_LANGUAGE_CODE,
    refDataType,
    queryString,
    limit,
  }: {
    language: string;
    refDataType: string;
    queryString: string;
    limit: number;
  }) => {
    return this.findAll({
      where: {
        language,
        stringId: {
          [Op.startsWith]: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${refDataType}.`,
        },
        ...(queryString ? { text: { [Op.iLike]: `%${queryString}%` } } : {}),
      },
      attributes: ['stringId', 'text'],
      raw: true,
      limit,
    });
  };

  static getTranslations = async (language: string, prefixIds: string[]) => {
    const translatedStringRecords = await TranslatedString.findAll({
      where: {
        language,
        // filter Boolean to avoid query all records
        [Op.or]: prefixIds.filter(Boolean).map((prefixId) => ({
          id: {
            [Op.startsWith]: prefixId,
          },
        })),
      },
      attributes: ['stringId', 'text'],
    });

    const translations = mapValues(keyBy(translatedStringRecords, 'stringId'), 'text');
    return translations;
  };

  static getTranslationFunction = async (language: string, prefixIds: string[] = []) => {
    const translations = await TranslatedString.getTranslations(language, prefixIds);

    return (stringId: string, fallback: string, translationOptions: TranslationOptions) => {
      const translationFunc = translationFactory(translations);
      const { value } = translationFunc(stringId, fallback, translationOptions);
      return value;
    };
  };
}
