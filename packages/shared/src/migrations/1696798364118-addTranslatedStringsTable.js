import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable(
    'translated_strings',
    {
      // For translated_strings, we use a composite primary key of string_id plus language,
      // N.B. because ';' is used to join the two, we replace any actual occurrence of ';' with ':'
      // to avoid clashes on the joined id
      id: {
        type: `TEXT GENERATED ALWAYS AS (REPLACE("string_id", ';', ':') || ';' || REPLACE("language", ';', ':')) STORED`,
      },
      string_id: {
        type: DataTypes.TEXT,
        required: true,
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
        required: true,
        primaryKey: true,
        validate: {
          doesNotContainIdDelimiter: value => {
            if (value.includes(';')) {
              throw new Error('Language code cannot contain ";"');
            }
          },
        },
      },
      text: {
        type: DataTypes.TEXT,
        required: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn('current_timestamp', 3),
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn('current_timestamp', 3),
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      uniqueKeys: {
        string_language_unique: {
          fields: ['string_id', 'language'],
        },
      },
      indexes: [
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

export async function down(query) {
  await query.dropTable('translated_strings');
}
