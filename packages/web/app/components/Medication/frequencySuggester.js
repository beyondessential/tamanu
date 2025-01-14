export class FrequencySuggester {
  constructor(suggestions) {
    this.suggestions = suggestions;
  }

  fetchCurrentOption = async value => {
    return value;
  };

  fetchSuggestions = async search => {
    const searchLower = search.toLowerCase();

    return this.suggestions
      .filter(
        ({ label, synonyms }) =>
          label.toLowerCase().includes(searchLower) ||
          synonyms.some(syn => syn.toLowerCase().includes(searchLower)),
      )
      .sort(({ label: aLabel, synonyms: aSyn }, { label: bLabel, synonyms: bSyn }) => {
        const aStart = aLabel.toLowerCase().startsWith(searchLower);
        const bStart = bLabel.toLowerCase().startsWith(searchLower);
        if (aStart !== bStart) return bStart - aStart;

        const aInclude = aLabel.toLowerCase().includes(searchLower);
        const bInclude = bLabel.toLowerCase().includes(searchLower);
        if (aInclude !== bInclude) return bInclude - aInclude;

        const aSynInclude = aSyn.some(syn => syn.toLowerCase().includes(searchLower));
        const bSynInclude = bSyn.some(syn => syn.toLowerCase().includes(searchLower));
        return bSynInclude - aSynInclude;
      });
  };
}
