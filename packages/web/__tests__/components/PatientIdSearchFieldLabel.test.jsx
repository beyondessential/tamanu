import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, SettingsContext } from '@tamanu/ui-components';
import { replaceStringVariables } from '@tamanu/shared/utils/translation';
import { RecentlyDischargedPatientsSearchBar } from '../../app/components/SearchBar/RecentlyDischargedPatientsSearchBar';
import { TriageSearchBar } from '../../app/components/SearchBar/TriageSearchBar';
import { renderElementWithTranslatedText } from '../helpers';

const getSetting = () => undefined;

vi.mock('../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting }),
}));

vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true } }),
}));

vi.mock('../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useSuggester: () => ({
    fetchCurrentOption: vi.fn().mockResolvedValue(null),
    fetchSuggestions: vi.fn().mockResolvedValue([]),
  }),
}));

const translationContext = {
  getTranslation: (stringId, fallback, options) =>
    stringId === 'general.localisedField.displayId.label.short'
      ? 'XYZ ID'
      : replaceStringVariables(fallback, options),
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderSearchBar = SearchBar =>
  renderElementWithTranslatedText(
    <AuthContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
      <SettingsContext.Provider value={{ getSetting }}>
        <SearchBar onSearch={() => {}} searchParameters={{}} />
      </SettingsContext.Provider>
    </AuthContext.Provider>,
    undefined,
    translationContext,
  );

describe("patient ID search field uses the deployment's short display ID label", () => {
  it.each([
    ['Emergency patients', TriageSearchBar],
    ['Recently discharged patients', RecentlyDischargedPatientsSearchBar],
  ])('on %s', (_listName, SearchBar) => {
    renderSearchBar(SearchBar);

    expect(screen.getAllByText('XYZ ID').length).toBeGreaterThan(0);
    expect(screen.queryByText('Patient ID')).toBeNull();
  });
});
