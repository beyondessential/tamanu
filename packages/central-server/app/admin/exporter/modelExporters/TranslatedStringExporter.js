import { queryTranslatedStringsByLanguage } from '@tamanu/shared/utils/translation/queryTranslatedStringsByLanguage';
import { DefaultDataExporter } from './DefaultDataExporter';

export class TranslatedStringExporter extends DefaultDataExporter {
  async getData({ includeReferenceData: includeReferenceDataString }) {
    const { sequelize, models } = this;
    const includeReferenceData = includeReferenceDataString === 'true';
    return queryTranslatedStringsByLanguage({ sequelize, models, includeReferenceData });
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
