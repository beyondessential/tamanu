import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { DataTypes } from 'sequelize';
import { Model } from './Model';

export class TranslatedString extends Model {
  static init(options) {
    super.init(
      {
        id: {
          // translated_string records use a generated primary key that enforces one per string and language,
          type: `TEXT GENERATED ALWAYS AS (REPLACE("string_id", ';', ':') || ';' || REPLACE("language", ';', ':')) STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
        },
        stringId: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        language: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
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
        ],
      },
    );
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
