import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutocompleteInput } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers';

const createDeferredSuggester = () => {
  const pendingSearches = new Map();
  return {
    pendingSearches,
    fetchCurrentOption: vi.fn().mockResolvedValue(undefined),
    fetchSuggestions: vi.fn(
      search =>
        new Promise(resolve => {
          pendingSearches.set(search, resolve);
        }),
    ),
  };
};

describe('AutocompleteInput', () => {
  it('keeps the suggestions for the latest search when an earlier search responds last', async () => {
    const suggester = createDeferredSuggester();
    renderElementWithTranslatedText(
      <AutocompleteInput name="diagnosisId" value="" onChange={() => {}} suggester={suggester} />,
    );
    const input = screen.getByRole('textbox');

    // Pause after the first character long enough for its (slow, broad) search to be sent
    await userEvent.type(input, 'E');
    await waitFor(() => expect(suggester.pendingSearches.has('E')).toBe(true));
    await userEvent.type(input, '11.65');
    await waitFor(() => expect(suggester.pendingSearches.has('E11.65')).toBe(true));

    suggester.pendingSearches.get('E11.65')([
      { label: 'Type 2 diabetes mellitus with hyperglycaemia', value: 'icd-E11.65' },
    ]);
    await screen.findByText('Type 2 diabetes mellitus with hyperglycaemia');

    suggester.pendingSearches.get('E')([
      { label: 'Early congenital syphilis', value: 'icd-A50' },
    ]);
    // Let the stale response settle before asserting it was discarded
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });

    expect(screen.getByText('Type 2 diabetes mellitus with hyperglycaemia')).toBeDefined();
    expect(screen.queryByText('Early congenital syphilis')).toBeNull();
  });
});
