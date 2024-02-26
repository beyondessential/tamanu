import { LOCAL_STORAGE_KEYS } from '../constants';

const defaultFormatter = ({ name, id }) => ({ label: name, value: id });

const getCurrentLanguageCode = () => localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE) || 'en';

export class Suggester {
  constructor(
    api,
    endpoint,
    { formatter = defaultFormatter, filterer = () => true, baseQueryParameters = {} } = {},
  ) {
    this.api = api;
    this.endpoint = `suggestions/${encodeURIComponent(endpoint)}`;
    this.formatter = formatter;
    this.filterer = filterer;
    this.baseQueryParameters = baseQueryParameters;
  }

  async fetch(suffix, queryParameters) {
    return this.api.get(`${this.endpoint}${suffix}`, queryParameters);
  }

  fetchCurrentOption = async value => {
    try {
      const data = await this.fetch(`/${encodeURIComponent(value)}`, { language: getCurrentLanguageCode() });
      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async search => {
    try {
      const data = await this.fetch('', {
        ...this.baseQueryParameters,
        q: search,
        language: getCurrentLanguageCode(),
      });
      return data.filter(this.filterer).map(this.formatter);
    } catch (e) {
      return [];
    }
  };
}
