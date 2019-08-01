
export class Suggester {
  
  constructor(endpoint, formatLabel) {
    this.endpoint = endpoint;
    this.formatLabel = formatLabel;
  }

  fetchLabel = async (value) => {
    const response = await fetch(`${process.env.HOST}/suggestions/${this.endpoint}/${value}`);
    const data = await response.json();
    return this.formatLabel(data);
  }

  fetchSuggestions = async (search) => {
    const response = await fetch(`${process.env.HOST}/suggestions/${this.endpoint}?q=${search}`);
    const data = await response.json();
    return data.map(this.formatLabel);
  }

}
