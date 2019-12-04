export const mapToSuggestions = objects =>
  objects.map(({ _id, name }) => ({ label: name, value: _id }));

export function createDummySuggester(options) {
  return {
    fetchSuggestions: search => {
      const filter = ({ label }) => label.toLowerCase().includes(search.toLowerCase());
      return options.filter(filter).slice(0, 20);
    },
    fetchCurrentOption: value => options.find(s => s.value === value),
  };
}
