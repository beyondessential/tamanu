import * as React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Field, SettingsContext, TextField } from '@tamanu/ui-components';

import { CustomisableSearchBar } from '../../app/components/SearchBar/CustomisableSearchBar';
import { hasSearchCriteria } from '../../app/components/SearchBar/hasSearchCriteria';
import { renderElementWithTranslatedText } from '../helpers';

const renderSearchBar = props =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => undefined }}>
      <CustomisableSearchBar onSearch={vi.fn()} {...props}>
        <Field name="firstName" label="First name" component={TextField} />
      </CustomisableSearchBar>
    </SettingsContext.Provider>,
  );

const searchButton = () => screen.getByRole('button', { name: 'Search' });
const clearButton = () => screen.getByRole('button', { name: 'Clear' });

describe('CustomisableSearchBar', () => {
  it('keeps Search and Clear available when no criteria are required', () => {
    renderSearchBar();

    expect(searchButton()).toHaveProperty('disabled', false);
    expect(clearButton()).toHaveProperty('disabled', false);
  });

  describe('with canSearch', () => {
    it('disables Search and Clear until a field has a value', async () => {
      renderSearchBar({ canSearch: hasSearchCriteria });
      expect(searchButton()).toHaveProperty('disabled', true);
      expect(clearButton()).toHaveProperty('disabled', true);

      await userEvent.type(screen.getByRole('textbox', { name: 'First name' }), 'Ana');

      expect(searchButton()).toHaveProperty('disabled', false);
      expect(clearButton()).toHaveProperty('disabled', false);
    });

    it('keeps Clear available after a search, even once the fields are emptied', async () => {
      renderSearchBar({ canSearch: hasSearchCriteria });
      const firstName = screen.getByRole('textbox', { name: 'First name' });
      await userEvent.type(firstName, 'Ana');
      await userEvent.click(searchButton());

      await userEvent.clear(firstName);

      expect(searchButton()).toHaveProperty('disabled', true);
      expect(clearButton()).toHaveProperty('disabled', false);
    });
  });
});
