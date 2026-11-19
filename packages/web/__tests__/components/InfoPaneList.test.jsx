import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthContext, DateTimeProvider, SettingsContext } from '@tamanu/ui-components';
import { TranslationProvider } from '../../app/contexts/Translation';
import { createQueryClient, createStubTheme } from '../helpers';

const CONDITIONS = [
  {
    id: 'condition-1',
    condition: { id: 'diag-1', name: 'Asthma' },
    recordedDate: '2026-01-01 00:00:00',
    resolved: false,
  },
  {
    id: 'condition-2',
    condition: { id: 'diag-2', name: 'Gout' },
    recordedDate: '2026-01-02 00:00:00',
    resolved: true,
    resolutionDate: '2026-02-01 00:00:00',
  },
];

vi.mock('../../app/api', () => ({
  useApi: () => ({
    get: async endpoint =>
      String(endpoint).startsWith('suggestions/') ? { name: 'A Clinician' } : { data: CONDITIONS },
  }),
}));
vi.mock('../../app/contexts/Patient', () => ({
  usePatient: () => ({ patient: { id: 'patient-1' } }),
}));
vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true } }),
}));
vi.mock('../../app/contexts/NoteModal', () => ({
  useNoteModal: () => ({ isNoteModalOpen: false }),
}));

import { InfoPaneList } from '../../app/components/PatientInfoPane/InfoPaneList';
import { OngoingConditionDetails } from '../../app/components/PatientInfoPane/paneItemDetails';
import { OngoingConditionForm } from '../../app/forms/OngoingConditionForm';

const translationContext = {
  getTranslation: (_id, fallback) => fallback,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderConditions = ({ readonly = false } = {}) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ThemeProvider theme={createStubTheme()}>
        <TranslationProvider value={translationContext}>
          <AuthContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
            <SettingsContext.Provider value={{ getSetting: () => undefined }}>
              <DateTimeProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <InfoPaneList
                    id="conditions"
                    patient={{ id: 'patient-1' }}
                    readonly={readonly}
                    title="Ongoing conditions"
                    endpoint="ongoingCondition"
                    getEndpoint="patient/patient-1/conditions"
                    Form={OngoingConditionForm}
                    getName={({ condition }) => condition.name}
                    ItemDetails={OngoingConditionDetails}
                  />
                </LocalizationProvider>
              </DateTimeProvider>
            </SettingsContext.Provider>
          </AuthContext.Provider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

const isBefore = (first, second) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('InfoPaneList', () => {
  it('opens the add form above the existing items', async () => {
    renderConditions();
    const firstRow = await screen.findByTestId('listitem-adip-0');

    fireEvent.click(screen.getByTestId('addbutton-b0ln'));

    expect(isBefore(screen.getByTestId('collapse-qeou'), firstRow)).toBe(true);
  });

  it('opens the edit form in the item’s own place in the list', async () => {
    renderConditions();
    fireEvent.click(await screen.findByTestId('listitem-adip-1'));
    fireEvent.click(screen.getByTestId('infopaneitemdetails-edit'));

    const firstItem = screen.getByTestId('listitem-adip-0').closest('li');
    const secondItem = screen.getByTestId('listitem-adip-1').closest('li');
    expect(within(secondItem).getByTestId('collapse-0a33')).toBeTruthy();
    expect(within(firstItem).queryByTestId('collapse-0a33')).toBeNull();
  });

  it('offers to resolve only an unresolved condition', async () => {
    renderConditions();

    fireEvent.click(await screen.findByTestId('listitem-adip-0'));
    expect(screen.getByTestId('mark-condition-resolved-button')).toBeTruthy();

    fireEvent.click(screen.getByTestId('listitem-adip-1'));
    const resolvedItem = screen.getByTestId('listitem-adip-1').closest('li');
    expect(
      await within(resolvedItem).findByTestId('infopaneitemdetails-resolutionDate'),
    ).toBeTruthy();
    expect(within(resolvedItem).queryByTestId('mark-condition-resolved-button')).toBeNull();
  });

  it('shows details read-only for a deceased patient', async () => {
    renderConditions({ readonly: true });

    fireEvent.click(await screen.findByTestId('listitem-adip-0'));

    expect(screen.getByTestId('infopaneitemdetails-recordedDate')).toBeTruthy();
    expect(screen.queryByTestId('infopaneitemdetails-edit')).toBeNull();
    expect(screen.queryByTestId('mark-condition-resolved-button')).toBeNull();
    expect(screen.queryByTestId('addbutton-b0ln')).toBeNull();
  });
});
