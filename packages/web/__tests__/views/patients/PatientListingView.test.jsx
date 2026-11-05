import * as React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@tamanu/ui-components';
import { replaceStringVariables } from '@tamanu/shared/utils/translation';

import { renderElementWithTranslatedText } from '../../helpers';

const auth = vi.hoisted(() => ({ canListPatients: true, isLoaded: true }));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({
    facilityId: 'facility-1',
    ability: auth.isLoaded ? { can: () => auth.canListPatients } : null,
  }),
}));

vi.mock('../../../app/components', async importOriginal => ({
  ...(await importOriginal()),
  // Stands in for the search bar: each button submits a set of search parameters
  AllPatientsSearchBar: ({ onSearch }) => (
    <>
      <button type="button" onClick={() => onSearch({ firstName: 'Ana' })}>
        search-by-name
      </button>
      <button type="button" onClick={() => onSearch({ deceased: true })}>
        search-deceased-only
      </button>
      <button type="button" onClick={() => onSearch({})}>
        clear
      </button>
    </>
  ),
  SearchTableWithPermissionCheck: () => <div data-testid="patient-table" />,
  TopBar: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../app/components/RecentlyViewedPatientsList', () => ({
  RecentlyViewedPatientsList: () => null,
}));

vi.mock('../../../app/views/patients/components', () => ({
  NewPatientModal: () => null,
}));

vi.mock('../../../app/utils/usePatientNavigation', () => ({
  usePatientNavigation: () => ({ navigateToPatient: vi.fn() }),
}));

import { PatientListingView } from '../../../app/views/patients/PatientListingView';

const translationContext = {
  getTranslation: (_stringId, fallback, options) => replaceStringVariables(fallback, options),
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderView = () =>
  renderElementWithTranslatedText(
    <AuthContext.Provider value={{ ability: { can: () => auth.canListPatients } }}>
      <PatientListingView />
    </AuthContext.Provider>,
    undefined,
    translationContext,
  );

describe('PatientListingView', () => {
  beforeEach(() => {
    auth.canListPatients = true;
    auth.isLoaded = true;
  });

  it('shows the guided empty state, not the table, before a search', () => {
    renderView();

    expect(screen.getByText('Search for a patient')).toBeTruthy();
    expect(screen.queryByTestId('patient-table')).toBeNull();
  });

  it("names the deployment's identifier and the advanced search toggle in the hint", () => {
    renderView();

    const hint = screen.getByTestId('patientsearchemptystate').textContent;
    expect(hint).toContain('Search by NHN, name or date of birth. Otherwise select');
    expect(hint).toContain('for more advanced search options.');
    expect(hint).not.toContain(':advancedSearchIcon');
    expect(screen.getByTitle('advanced search')).toBeTruthy();
  });

  it('lists patients once a search with criteria runs', async () => {
    renderView();

    await userEvent.click(screen.getByRole('button', { name: 'search-by-name' }));

    expect(screen.getByTestId('patient-table')).toBeTruthy();
    expect(screen.queryByText('Search for a patient')).toBeNull();
  });

  it('stays empty when only "Include deceased patients" is searched', async () => {
    renderView();

    await userEvent.click(screen.getByRole('button', { name: 'search-deceased-only' }));

    expect(screen.queryByTestId('patient-table')).toBeNull();
  });

  it('returns to the empty state when the search is cleared', async () => {
    renderView();
    await userEvent.click(screen.getByRole('button', { name: 'search-by-name' }));

    await userEvent.click(screen.getByRole('button', { name: 'clear' }));

    expect(screen.queryByTestId('patient-table')).toBeNull();
    expect(screen.getByText('Search for a patient')).toBeTruthy();
  });

  it('leaves the no-permission table in place for users who cannot list patients', () => {
    auth.canListPatients = false;
    renderView();

    expect(screen.getByTestId('patient-table')).toBeTruthy();
    expect(screen.queryByText('Search for a patient')).toBeNull();
  });

  it('holds the empty state while auth is still loading, rather than listing every patient', () => {
    auth.isLoaded = false;
    renderView();

    expect(screen.getByText('Search for a patient')).toBeTruthy();
    expect(screen.queryByTestId('patient-table')).toBeNull();
  });
});
