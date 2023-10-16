import { QueryTypes } from 'sequelize';
import { DefaultDataExporter } from './DefaultDataExporter';
import { LANGUAGE_CODES } from '@tamanu/constants';

export class TranslatedStringExporter extends DefaultDataExporter {
  async getData() {
    const translations = await this.sequelize.query(
      `
    SELECT
        string_id as stringId,
        ${Object.values(LANGUAGE_CODES)
          .map(code => `MAX(text) FILTER(WHERE language = '${code}') AS ${code}`)
          .join(',')}
    FROM
        translated_strings
    GROUP BY
        string_id;
    `,
      {
        type: QueryTypes.SELECT,
      },
    );
    return translations;
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
