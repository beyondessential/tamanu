import { queryTranslatedStringsByLanguage } from '@tamanu/shared/utils/translation/queryTranslatedStringsByLanguage';
import { DefaultDataExporter } from './DefaultDataExporter';

export class TranslatedStringExporter extends DefaultDataExporter {
  async getData() {
    return queryTranslatedStringsByLanguage(this);
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
