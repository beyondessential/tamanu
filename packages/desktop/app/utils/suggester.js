const defaultFormatter = ({ name, id }) => ({ label: name, value: id });

export class Suggester {
  constructor(api, endpoint, formatter = defaultFormatter) {
    this.api = api;
    this.endpoint = `suggestions/${encodeURIComponent(endpoint)}`;
    this.formatter = formatter;
  }

  async fetch(suffix, queryParameters) {
    return this.api.get(`${this.endpoint}${suffix}`, queryParameters);
  }

  fetchCurrentOption = async value => {
    try {
      const data = await this.fetch(`/${encodeURIComponent(value)}`);
      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async search => {
    try {
      const data = await this.fetch('', { q: search });
      return data.map(this.formatter);
    } catch (e) {
      return [];
    }
  };
}
