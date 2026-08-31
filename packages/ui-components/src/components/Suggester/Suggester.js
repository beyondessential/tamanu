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
  }

  /**
   * One suggester instance is routinely shared by several fields — a form typically creates a single
   * `practitioner` suggester and hands it to every clinician field on the form. So each call must
   * resolve to its own response: caching the last response on the instance and returning that
   * instead would let concurrent callers read each other's data, which showed up as one field
   * displaying another field's selection.
   */
  async fetch(suffix, queryParameters) {
    return this.api.get(`${this.endpoint}${suffix}`, queryParameters);
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
