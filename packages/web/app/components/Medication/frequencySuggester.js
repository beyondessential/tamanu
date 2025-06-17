export class FrequencySuggester {
  constructor(suggestions) {
    this.suggestions = suggestions;
  }

  fetchCurrentOption = async value => {
    if (!value || typeof value !== 'string') {
      return null;
    }
    // Find the suggestion object that matches the given value (ID)
    const selectedSuggestion = this.suggestions.find(
      suggestion => suggestion.value === value,
    );
    return selectedSuggestion || null;
  };

  fetchSuggestions = async search => {
    const searchLower = search.toLowerCase();
  
    const getMatchType = (label, synonyms) => {
      if (label.toLowerCase().startsWith(searchLower)) {
        return 1; // Primary search string begins with search term
      }
      if (label.toLowerCase().includes(searchLower)) {
        return 2; // Primary search string contains search term
      }
      for (const synonym of synonyms) {
        if (synonym.toLowerCase().includes(searchLower)) {
          return 3; // Secondary search string contains search term
        }
      }
      return 4; // No match
    };
  
    return this.suggestions
      .map(suggestion => ({
        ...suggestion,
        matchType: getMatchType(suggestion.label, suggestion.synonyms)
      }))
      .filter(suggestion => suggestion.matchType < 4) // Remove non-matches
      .sort((a, b) => {
        // First sort by match type
        if (a.matchType !== b.matchType) {
          return a.matchType - b.matchType;
        }
        // Then sort alphabetically by label
        return a.label.localeCompare(b.label);
      });
  };
}
