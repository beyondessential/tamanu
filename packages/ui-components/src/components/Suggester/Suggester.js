import { getCurrentLanguageCode } from '../Translation';

const defaultFormatter = ({ name, id }) => ({ label: name, value: id });

export class Suggester {
  constructor(
    api,
    endpoint,
    {
      formatter = defaultFormatter,
      filterer = () => true,
      baseQueryParameters = {},
      baseBodyParameters = {},
      enable = true,
    } = {},
  ) {
    this.api = api;
    this.endpoint = `suggestions/${encodeURIComponent(endpoint)}`;
    this.formatter = formatter;
    this.filterer = filterer;
    this.baseQueryParameters = baseQueryParameters;
    this.baseBodyParameters = baseBodyParameters;
    this.enable = enable;
    this.lastUpdatedAt = -Infinity;
    this.cachedData = null;
  }

  async fetch(suffix, queryParameters) {
    const requestedAt = Date.now();
    const data = await this.api.get(`${this.endpoint}${suffix}`, queryParameters);
    if (this.lastUpdatedAt < requestedAt) {
      this.cachedData = data;
      this.lastUpdatedAt = requestedAt;
    }

    return this.cachedData;
  }

  fetchCurrentOption = async value => {
    if (!this.enable) return undefined;
    try {
      const data = await this.fetch(`/${encodeURIComponent(value)}`, {
        language: getCurrentLanguageCode(),
        facilityId: this.baseQueryParameters?.facilityId,
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
      ...this.baseBodyParameters,
      ...body,
    });
    return this.formatter(data);
  };
}
