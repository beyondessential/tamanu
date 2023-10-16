import { DefaultDataExporter } from './DefaultDataExporter';
import { LANGUAGE_CODES } from '@tamanu/constants';
export class TranslatedStringExporter extends DefaultDataExporter {
  async getData() {
    const translations = await this.sequelize.query(`
    SELECT
        string_id as stringId,
        ${Object.values(LANGUAGE_CODES)
          .map(
            languageCode => `
            MAX(CASE WHEN language = '${languageCode}' THEN text END) AS ${languageCode}
        `,
          )
          .join(',')}
    FROM
        translated_strings
    GROUP BY
        string_id;
    `,
      {
        type: this.sequelize.QueryTypes.SELECT,
      },
    );
    return translations;
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
