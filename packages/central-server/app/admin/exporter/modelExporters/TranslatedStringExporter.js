import { queryTranslatedStringsByLanguage } from '@tamanu/shared/utils/translation/queryTranslatedStringsByLanguage';
import { DefaultDataExporter } from './DefaultDataExporter';

export class TranslatedStringExporter extends DefaultDataExporter {
  async getData({ includeReferenceData }) {
    const { sequelize, models } = this;
    return queryTranslatedStringsByLanguage({ sequelize, models, includeReferenceData });
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
