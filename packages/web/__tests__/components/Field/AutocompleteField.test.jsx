import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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

const createCreatableSuggester = (existingOptions = []) => ({
  fetchCurrentOption: vi.fn().mockResolvedValue(undefined),
  fetchSuggestions: vi.fn().mockResolvedValue(existingOptions),
  createSuggestion: vi.fn(({ name }) => Promise.resolve({ label: name, value: `new-${name}` })),
});

// react-autosuggest reads keyCode, which user-event does not set for these keys
const KEY_CODES = { ArrowDown: 40, ArrowUp: 38, Enter: 13 };
const pressKeys = (input, keys) => {
  for (const key of keys) {
    fireEvent.keyDown(input, { key, keyCode: KEY_CODES[key] });
  }
};

const renderCreatableInput = suggester => {
  const onChange = vi.fn();
  renderElementWithTranslatedText(
    <AutocompleteInput
      name="allergyId"
      value=""
      onChange={onChange}
      suggester={suggester}
      allowCreatingCustomValue
    />,
  );
  return { input: screen.getByRole('textbox'), onChange };
};

describe('AutocompleteInput', () => {
  describe('creating an item not in the list', () => {
    it('creates it once when picked with the arrow keys and Enter', async () => {
      const suggester = createCreatableSuggester();
      const { input, onChange } = renderCreatableInput(suggester);

      await userEvent.type(input, 'Zzsmoke');
      await screen.findByText(/item not in list/);
      pressKeys(input, ['ArrowDown', 'Enter']);

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith({
          target: { label: 'Zzsmoke', value: 'new-Zzsmoke', name: 'allergyId' },
        }),
      );
      expect(suggester.createSuggestion).toHaveBeenCalledTimes(1);
      expect(suggester.createSuggestion).toHaveBeenCalledWith({ name: 'Zzsmoke' });
    });

    it('creates it once when clicked', async () => {
      const suggester = createCreatableSuggester();
      const { input } = renderCreatableInput(suggester);

      await userEvent.type(input, 'Zzsmoke');
      await userEvent.click(await screen.findByText(/item not in list/));

      await waitFor(() => expect(suggester.createSuggestion).toHaveBeenCalledTimes(1));
    });

    it('closes the suggestions as soon as it is picked', async () => {
      const suggester = createCreatableSuggester();
      const { input } = renderCreatableInput(suggester);

      await userEvent.type(input, 'Zzsmoke');
      await screen.findByText(/item not in list/);
      pressKeys(input, ['ArrowDown', 'Enter']);

      expect(screen.queryByText(/item not in list/)).toBeNull();
    });

    it('creates it once when picked again while the first creation is pending', async () => {
      const suggester = createCreatableSuggester();
      let resolveCreation;
      suggester.createSuggestion.mockImplementationOnce(
        ({ name }) =>
          new Promise(resolve => {
            resolveCreation = () => resolve({ label: name, value: `new-${name}` });
          }),
      );
      const { input, onChange } = renderCreatableInput(suggester);

      await userEvent.type(input, 'Zzsmoke');
      await screen.findByText(/item not in list/);
      pressKeys(input, ['ArrowDown', 'Enter']);

      await userEvent.clear(input);
      await userEvent.type(input, 'Zzsmoke');
      await screen.findByText(/item not in list/);
      pressKeys(input, ['ArrowDown', 'Enter']);
      resolveCreation();

      await waitFor(() =>
        expect(onChange).toHaveBeenLastCalledWith({
          target: { label: 'Zzsmoke', value: 'new-Zzsmoke', name: 'allergyId' },
        }),
      );
      expect(suggester.createSuggestion).toHaveBeenCalledTimes(1);
    });

    it('does not create it when the arrow keys only pass over it', async () => {
      const suggester = createCreatableSuggester([{ label: 'Peanuts', value: 'allergy-peanuts' }]);
      const { input, onChange } = renderCreatableInput(suggester);

      await userEvent.type(input, 'Zzsmoke');
      await screen.findByText(/item not in list/);
      pressKeys(input, ['ArrowDown', 'ArrowDown', 'ArrowUp', 'Enter']);

      expect(suggester.createSuggestion).not.toHaveBeenCalled();
      expect(onChange).toHaveBeenLastCalledWith({
        target: { label: 'Peanuts', value: 'allergy-peanuts', name: 'allergyId' },
      });
    });
  });

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
