
export class Suggester {
  
  constructor(endpoint, formatLabel) {
    this.endpoint = endpoint;
    this.formatLabel = formatLabel;
  }

  fetchCurrentOption = async (value) => {
    const response = await fetch(`${process.env.HOST}/suggestions/${this.endpoint}/${value}`);
    const data = await response.json();
    if(!data) {
      return null;
    }
    return this.formatLabel(data);
  }

  fetchSuggestions = async (search) => {
    const response = await fetch(`${process.env.HOST}/suggestions/${this.endpoint}?q=${search}`);
    const data = await response.json();
    return data.map(this.formatLabel);
  }

}
