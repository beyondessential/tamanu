import { groupBy, map } from 'lodash';
import { getCurrentLanguageCode } from './translation';

const defaultFormatter = ({ name, id }) => ({ label: name, value: id });

export class Suggester {
  constructor(
    api,
    endpoint,
    {
      formatter = defaultFormatter,
      filterer = () => true,
      baseQueryParameters = {},
      createSuggestionPayload = {},
      enable = true,
    } = {},
  ) {
    this.api = api;
    this.endpoint = `suggestions/${encodeURIComponent(endpoint)}`;
    this.formatter = formatter;
    this.filterer = filterer;
    this.baseQueryParameters = baseQueryParameters;
    this.createSuggestionPayload = createSuggestionPayload;
    this.enable = enable;
  }

  async fetch(suffix, queryParameters) {
    return this.api.get(`${this.endpoint}${suffix}`, queryParameters);
  }

  fetchCurrentOption = async value => {
    if (!this.enable) return undefined;
    try {
      const data = await this.fetch(`/${encodeURIComponent(value)}`, {
        language: getCurrentLanguageCode(),
      });
      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async search => {
    if (!this.enable) return [];
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

  createSuggestion = async body => {
    if (!this.enable) throw new Error('Suggester is disabled');

    const data = await this.api.post(`${this.endpoint}/create`, {
      ...body,
      ...this.createSuggestionPayload,
    });
    return this.formatter(data);
  };
}
