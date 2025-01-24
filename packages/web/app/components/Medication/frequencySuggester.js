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
      .sort(({ label: aLabel, synonyms: aSynonym }, { label: bLabel, synonyms: bSynonym }) => {
        const aStart = aLabel.toLowerCase().startsWith(searchLower);
        const bStart = bLabel.toLowerCase().startsWith(searchLower);
        if (aStart !== bStart) return bStart - aStart;

        const aInclude = aLabel.toLowerCase().includes(searchLower);
        const bInclude = bLabel.toLowerCase().includes(searchLower);
        if (aInclude !== bInclude) return bInclude - aInclude;

        const aSynonymInclude = aSynonym.some(synonym =>
          synonym.toLowerCase().includes(searchLower),
        );
        const bSynonymInclude = bSynonym.some(synonym =>
          synonym.toLowerCase().includes(searchLower),
        );
        return bSynonymInclude - aSynonymInclude;
      });
  };
}
