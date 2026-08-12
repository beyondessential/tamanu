import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';

import { SettingsContext } from '@tamanu/ui-components';

import { createQueryClient, createStubTheme } from '../../helpers';
import { TranslationProvider } from '../../../app/contexts/Translation';
import { DispenseMedicationWorkflowModal } from '../../../app/components/Medication/DispenseMedicationWorkflowModal';

const PATIENT = {
  id: 'patient-1',
  displayId: 'DTLP266905',
  firstName: 'Sanford',
  lastName: 'Sipes',
};
const FACILITY_ID = 'facility-1';

const dispensableItem = {
  id: 'pop-1',
  displayId: 'REQ-1',
  quantity: 4,
  remainingRepeats: 0,
  lastDispensedAt: null,
  prescription: {
    id: 'prescription-1',
    date: '2026-08-10 09:00:00',
    frequency: 'Daily in the morning',
    route: 'oral',
    doseAmount: 1,
    dosingUnit: 'Tablet',
    dispensingUnit: 'Tablet',
    medication: { id: 'drug-1', name: 'Amoxicillin 500mg capsule', type: 'drug' },
  },
};

const getMock = vi.fn();

const suggester = {
  fetchSuggestions: async () => [],
  fetchCurrentOption: async () => null,
};

vi.mock('../../../app/api', () => ({
  useApi: () => ({ get: getMock }),
  useSuggester: () => suggester,
}));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({
    ability: { can: () => true },
    facilityId: FACILITY_ID,
    currentUser: { id: 'user-1', displayName: 'Initial Admin' },
  }),
}));

vi.mock('../../../app/utils/usePatientNavigation', () => ({
  usePatientNavigation: () => ({ navigateToPatient: vi.fn() }),
}));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useApi: () => ({ get: getMock, post: vi.fn() }),
    useSuggester: () => suggester,
    useDateTime: () => ({
      formatShort: value => String(value ?? ''),
      formatTime: value => String(value ?? ''),
      getCurrentDateTime: () => '2026-08-12 10:00:00',
    }),
  };
});

const translationContext = {
  getTranslation: (_stringId, fallback) => fallback,
  getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
  getReferenceDataTranslation: ({ fallback }) => fallback,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderModal = queryClient =>
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={createStubTheme()}>
        <SettingsContext.Provider value={{ getSetting: () => undefined }}>
          <TranslationProvider value={translationContext}>
            <DispenseMedicationWorkflowModal open onClose={() => {}} patient={PATIENT} />
          </TranslationProvider>
        </SettingsContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

describe('DispenseMedicationWorkflowModal', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockImplementation(async endpoint => {
      if (endpoint === 'medication/dispensable-medications') return { data: [dispensableItem] };
      return { data: [] };
    });
  });

  it('lists the medications available to dispense', async () => {
    renderModal(createQueryClient());

    expect(await screen.findByText('Amoxicillin 500mg capsule')).toBeTruthy();
  });

  // A cached list is served synchronously on open, and it can predate a change made elsewhere —
  // e.g. cancelling a dispense, which puts the request back in the dispensable list.
  it('shows the refetched list rather than the stale cached one', async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(['dispensableMedications', PATIENT.id, FACILITY_ID], { data: [] });

    renderModal(queryClient);

    expect(await screen.findByText('Amoxicillin 500mg capsule')).toBeTruthy();
    expect(screen.queryByText('No data')).toBeNull();
  });
});
