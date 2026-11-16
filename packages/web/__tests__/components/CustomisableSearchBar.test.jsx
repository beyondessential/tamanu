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

  it('searches with leading and trailing spaces removed', async () => {
    const onSearch = vi.fn();
    renderSearchBar({ onSearch });

    await userEvent.type(screen.getByRole('textbox', { name: 'First name' }), '  Ana  ');
    await userEvent.click(searchButton());

    expect(onSearch).toHaveBeenLastCalledWith({ firstName: 'Ana' });
  });

  it('searches a field of only spaces as blank', async () => {
    const onSearch = vi.fn();
    renderSearchBar({ onSearch });

    await userEvent.type(screen.getByRole('textbox', { name: 'First name' }), '   ');
    await userEvent.click(searchButton());

    expect(onSearch).toHaveBeenLastCalledWith({ firstName: '' });
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

    it('keeps Search and Clear available after a search, even once the fields are emptied', async () => {
      renderSearchBar({ canSearch: hasSearchCriteria });
      const firstName = screen.getByRole('textbox', { name: 'First name' });
      await userEvent.type(firstName, 'Ana');
      await userEvent.click(searchButton());

      await userEvent.clear(firstName);

      expect(searchButton()).toHaveProperty('disabled', false);
      expect(clearButton()).toHaveProperty('disabled', false);
    });

    it('ignores a field of only spaces when another field is filled', async () => {
      const onSearch = vi.fn();
      renderElementWithTranslatedText(
        <SettingsContext.Provider value={{ getSetting: () => undefined }}>
          <CustomisableSearchBar onSearch={onSearch} canSearch={hasSearchCriteria}>
            <Field name="firstName" label="First name" component={TextField} />
            <Field name="lastName" label="Last name" component={TextField} />
          </CustomisableSearchBar>
        </SettingsContext.Provider>,
      );

      await userEvent.type(screen.getByRole('textbox', { name: 'First name' }), '   ');
      await userEvent.type(screen.getByRole('textbox', { name: 'Last name' }), 'Ana');
      await userEvent.click(searchButton());

      expect(onSearch).toHaveBeenLastCalledWith({ firstName: '', lastName: 'Ana' });
    });

    it('clears when searching with the fields emptied', async () => {
      const onSearch = vi.fn();
      renderSearchBar({ canSearch: hasSearchCriteria, onSearch });
      const firstName = screen.getByRole('textbox', { name: 'First name' });
      await userEvent.type(firstName, 'Ana');
      await userEvent.click(searchButton());
      await userEvent.clear(firstName);

      await userEvent.click(searchButton());

      expect(onSearch).toHaveBeenLastCalledWith({});
      expect(searchButton()).toHaveProperty('disabled', true);
      expect(clearButton()).toHaveProperty('disabled', true);
    });
  });
});
