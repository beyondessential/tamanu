const defaultFormatter = ({ name, id }) => ({ label: name, value: id });

export class HierarchySuggester {
  constructor(
    api,
    parentId,
    { formatter = defaultFormatter, baseQueryParameters = {} } = {},
  ) {
    this.api = api;
    this.formatter = formatter;
    this.baseQueryParameters = baseQueryParameters;
    this.parentId = parentId;
  }

  async fetch(suffix, queryParameters) {
    return this.api.get(`referenceData/${suffix}`, queryParameters);
  }

  fetchCurrentOption = async value => {
    try {
      const data = await this.fetch(value);
      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async search => {
    if (!this.parentId) return [];
    try {
      const data = await this.fetch(`${this.parentId}/children`, { ...this.baseQueryParameters, q: search });
      return data.map(this.formatter);
    } catch (e) {
      return [];
    }
  };
}
