import { QueryTypes } from 'sequelize';

/**
 * Queries translated_string table and returns all translated strings grouped by stringId with a column
 * for each language code.
 * @example [{ stringId: 'login.email', en: 'Email', km: 'អ៊ីមែល' }]
 */
export const queryTranslatedStringsByLanguage = async ({ sequelize, models }) => {
  const { TranslatedString } = models;
  const languagesInDb = await TranslatedString.findAll({
    attributes: ['language'],
    group: 'language',
  });
  const translations = await sequelize.query(
    `
      SELECT
          string_id as "stringId",
          ${languagesInDb
            .map(
              ({ language }) => `MAX(text) FILTER(WHERE language = '${language}') AS ${language}`,
            )
            .join(',')}
      FROM
          translated_strings
      GROUP BY
          string_id
      ORDER BY
          string_id
      `,
    {
      type: QueryTypes.SELECT,
    },
  );
  return translations;
};
