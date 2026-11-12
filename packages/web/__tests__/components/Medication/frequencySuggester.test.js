import { describe, it, expect } from 'vitest';
import { ADMINISTRATION_FREQUENCIES, ADMINISTRATION_FREQUENCY_SYNONYMS } from '@tamanu/constants';

import { FrequencySuggester } from '../../../app/components/Medication/frequencySuggester';

const suggester = new FrequencySuggester(
  Object.entries(ADMINISTRATION_FREQUENCY_SYNONYMS).map(([frequency, synonyms]) => ({
    value: frequency,
    label: frequency,
    synonyms,
  })),
);

describe('FrequencySuggester', () => {
  it.each(['q2h', '2h', '2 hourly', '2 hrly'])('finds Every 2 hours by "%s"', async search => {
    const suggestions = await suggester.fetchSuggestions(search);

    expect(suggestions.map(suggestion => suggestion.value)).toContain(
      ADMINISTRATION_FREQUENCIES.EVERY_2_HOURS,
    );
  });
});
