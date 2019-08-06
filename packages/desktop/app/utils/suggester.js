const defaultFormatter = ({ name, _id }) => ({ label: name, value: _id });

export class Suggester {
  constructor(endpoint, formatter = defaultFormatter) {
    this.endpoint = endpoint;
    this.formatter = formatter;
  }

  fetchCurrentOption = async value => {
    const response = await fetch(`${process.env.HOST}/suggestions/${this.endpoint}/${value}`);
    try {
      const data = await response.json();
      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async search => {
    const response = await fetch(`${process.env.HOST}/suggestions/${this.endpoint}?q=${search}`);
    try {
      const data = await response.json();
      return data.map(this.formatter);
    } catch (e) {
      return [];
    }
  };
}
