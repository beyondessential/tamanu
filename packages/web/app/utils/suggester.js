const defaultFormatter = ({ name, id }) => ({ label: name, value: id });

export class Suggester {
  constructor(
    api,
    endpoint,
    { formatter = defaultFormatter, filterer = () => true, baseQueryParameters = {}, enable = true} = {},
  ) {
    this.api = api;
    this.endpoint = `suggestions/${encodeURIComponent(endpoint)}`;
    this.formatter = formatter;
    this.filterer = filterer;
    this.baseQueryParameters = baseQueryParameters;
    this.enable = enable;
  }

  async fetch(suffix, queryParameters) {
    return this.api.get(`${this.endpoint}${suffix}`, queryParameters);
  }

  fetchCurrentOption = async value => {
    if (!this.enable) return undefined;
    try {
      const data = await this.fetch(`/${encodeURIComponent(value)}`);
      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async search => {
    if (!this.enable) return [];
    try {
      const data = await this.fetch('', { ...this.baseQueryParameters, q: search });
      return data.filter(this.filterer).map(this.formatter);
    } catch (e) {
      return [];
    }
  };
}
