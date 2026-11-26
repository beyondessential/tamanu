import * as React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthContext, DateTimeProvider, SettingsContext } from '@tamanu/ui-components';
import { AllPatientsSearchBar } from '../../app/components/SearchBar/AllPatientsSearchBar';
import { renderElementWithTranslatedText } from '../helpers';

let settings = {};
const getSetting = key => settings[key];

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

const renderExpandedSearchBar = async () => {
  renderElementWithTranslatedText(
    <AuthContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
      <SettingsContext.Provider value={{ getSetting }}>
        <DateTimeProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AllPatientsSearchBar onSearch={() => {}} searchParameters={{}} />
          </LocalizationProvider>
        </DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'show advanced search' }));
};

describe('AllPatientsSearchBar', () => {
  it('offers QR scanning on the display ID but not cultural name by default', async () => {
    settings = {};
    await renderExpandedSearchBar();

    expect(screen.getByTestId('qr-scanner-button-displayId')).toBeTruthy();
    expect(screen.queryByTestId('qr-scanner-button-culturalName')).toBeNull();
  });

  it('offers QR scanning on cultural name when its QR code scanner customisation is set', async () => {
    settings = {
      'customisations.componentVersions': { CulturalNameSearchField: 'qrCodeScanner' },
    };
    await renderExpandedSearchBar();

    expect(screen.getByTestId('qr-scanner-button-culturalName')).toBeTruthy();
    expect(screen.getByTestId('localisedfield-epbq-input')).toBeTruthy();
  });
});
