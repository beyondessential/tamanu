import { QueryTypes } from 'sequelize';
import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

const EXCLUDE_REFERENCE_DATA_CLAUSE = `AND string_id NOT LIKE '${REFERENCE_DATA_TRANSLATION_PREFIX}.%'`;

/**
 * Queries translated_string table and returns all translated strings grouped by stringId with a column
 * for each language code.
 * @example [{ stringId: 'login.email', en: 'Email', km: 'អ៊ីមែល' }]
 */
export const queryTranslatedStringsByLanguage = async ({
  sequelize,
  models,
  includeReferenceData = true,
}) => {
  const { TranslatedString } = models;
  const languagesInDb = await TranslatedString.findAll({
    attributes: ['language'],
    group: 'language',
  });

  if (!languagesInDb.length) return [];

  const translations = await sequelize.query(
    `
      SELECT
          string_id as "stringId",
          ${languagesInDb
            .map((_, index) => `MAX(text) FILTER(WHERE language = $lang${index}) AS "lang${index}"`)
            .join(',')}
      FROM
          translated_strings
      WHERE deleted_at IS NULL
      ${includeReferenceData ? '' : EXCLUDE_REFERENCE_DATA_CLAUSE}
      GROUP BY
          string_id
      ORDER BY
          string_id
      `,
    {
      bind: {
        ...Object.fromEntries(
          languagesInDb.map(({ language }, index) => [`lang${index}`, language]),
        ),
      },
      type: QueryTypes.SELECT,
    },
  );

  // Because there is no way to escape the alias above, we need update the resulting
  // object to switch the dynamic alias to the expected alias which should exactly
  // match the language column from the translated string.
  const mappedTranslations = translations.map((row) => {
    const newRow = { stringId: row.stringId };
    languagesInDb.forEach(({ language }, index) => {
      newRow[language] = row[`lang${index}`];
    });
    return newRow;
  });

  return mappedTranslations;
};
