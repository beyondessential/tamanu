const defaultFormatter = ({ name, _id }) => ({ label: name, value: _id });

export class Suggester {
  constructor(endpoint, formatLabel = defaultFormatter) {
    this.endpoint = endpoint;
    this.formatLabel = formatLabel;
  }

  fetchCurrentOption = async value => {
    const response = await fetch(`${process.env.HOST}/suggestions/${this.endpoint}/${value}`);
    try {
      const data = await response.json();
      return this.formatLabel(data);
    } catch(e) {
      return undefined;
    }
  };

  fetchSuggestions = async search => {
    const response = await fetch(`${process.env.HOST}/suggestions/${this.endpoint}?q=${search}`);
    try {
      const data = await response.json();
      return data.map(this.formatLabel);
    } catch(e) {
      return [];
    }
  };
}
