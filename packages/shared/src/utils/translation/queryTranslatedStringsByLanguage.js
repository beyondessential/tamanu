import { QueryTypes } from 'sequelize';
import { LANGUAGE_CODES } from '@tamanu/constants';

/**
 * Queries translated_string table and returns all translated strings grouped by stringId with a column
 * for each language code.
 * @example [{ stringId: 'login.email', en: 'Email', km: 'អ៊ីមែល' }]
 */
export const queryTranslatedStringsByLanguage = async sequelize => {
  const translations = await sequelize.query(
    `
      SELECT
          string_id as "stringId",
          ${Object.values(LANGUAGE_CODES)
            .map(code => `MAX(text) FILTER(WHERE language = '${code}') AS ${code}`)
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
