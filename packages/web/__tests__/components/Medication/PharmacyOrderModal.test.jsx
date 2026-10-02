import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';

import { SettingsContext } from '@tamanu/ui-components';

import { createQueryClient, createStubTheme } from '../../helpers';
import { TranslationProvider } from '../../../app/contexts/Translation';
import { PharmacyOrderModal } from '../../../app/components/Medication/PharmacyOrderModal';

const ENCOUNTER = { id: 'encounter-1' };
const FACILITY_ID = 'facility-1';
const CURRENT_USER = { id: 'user-1', displayName: 'Initial Admin' };

const buildPrescription = overrides => ({
  id: 'prescription-1',
  quantity: 2,
  repeats: 0,
  discontinued: false,
  lastOrderedAt: null,
  medication: { id: 'drug-1', name: 'Amoxicillin 500mg capsule' },
  ...overrides,
});

const { getMock, postMock, notifyError } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  notifyError: vi.fn(),
}));

const suggester = {
  fetchSuggestions: async () => [],
  fetchCurrentOption: async () => null,
};

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useApi: () => ({ get: getMock, post: postMock }),
    useAuth: () => ({
      ability: { can: () => true },
      facilityId: FACILITY_ID,
      currentUser: CURRENT_USER,
    }),
    useSuggester: () => suggester,
    useDateTime: () => ({
      storedDateTimeToEpochMilliseconds: value => new Date(value).getTime(),
    }),
  };
});

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ facilityId: FACILITY_ID }),
}));

vi.mock('../../../app/utils', async importOriginal => ({
  ...(await importOriginal()),
  notifyError,
}));

// The real table is a full editable grid; a checkbox per selectable row is all these cases need.
vi.mock('../../../app/components/Medication/PharmacyOrderMedicationTable', async importOriginal => ({
  ...(await importOriginal()),
  PharmacyOrderMedicationTable: ({ data }) => (
    <div>
      {data.map(row =>
        row.onSelect ? (
          <input
            key={row.id}
            type="checkbox"
            aria-label={row.medication.name}
            checked={row.selected}
            onChange={row.onSelect}
          />
        ) : (
          <span key={row.id}>{row.medication.name}</span>
        ),
      )}
    </div>
  ),
}));

const settingsContext = {
  getSetting: key =>
    key === 'features.pharmacyOrder.medicationAlreadyOrderedConfirmationTimeout' ? 24 : undefined,
};

const translationContext = {
  getTranslation: (_stringId, fallback) => fallback,
  getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
  getReferenceDataTranslation: ({ fallback }) => fallback,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderModal = ({ onSubmit = () => {} } = {}) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ThemeProvider theme={createStubTheme()}>
        <SettingsContext.Provider value={settingsContext}>
          <TranslationProvider value={translationContext}>
            <PharmacyOrderModal encounter={ENCOUNTER} open onClose={() => {}} onSubmit={onSubmit} />
          </TranslationProvider>
        </SettingsContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

const selectPrescription = async () => {
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Amoxicillin 500mg capsule' }));
};

const getButton = name => screen.getByRole('button', { name });

const neverSettles = () => new Promise(() => {});

describe('PharmacyOrderModal', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    notifyError.mockReset();
    getMock.mockResolvedValue({ data: [buildPrescription()] });
  });

  it('sends the order only once when Send is clicked again while the request is in flight', async () => {
    postMock.mockImplementation(neverSettles);
    renderModal();
    await selectPrescription();

    fireEvent.click(getButton('Send'));
    await waitFor(() => expect(getButton('Send').disabled).toBe(true));
    fireEvent.click(getButton('Send'));

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      `encounter/${ENCOUNTER.id}/pharmacyOrder`,
      expect.objectContaining({
        pharmacyOrderPrescriptions: [{ prescriptionId: 'prescription-1', quantity: 2, repeats: 0 }],
      }),
    );
  });

  it('sends the order only once when Confirm is clicked again on the already-sent warning', async () => {
    getMock.mockResolvedValue({
      data: [buildPrescription({ lastOrderedAt: new Date().toISOString() })],
    });
    postMock.mockImplementation(neverSettles);
    renderModal();
    await selectPrescription();

    fireEvent.click(getButton('Send'));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(getButton('Confirm').disabled).toBe(true));
    expect(getButton('Back').disabled).toBe(true);
    fireEvent.click(getButton('Confirm'));

    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it('shows the success screen without waiting for the medication list to refetch', async () => {
    const onSubmit = vi.fn();
    postMock.mockResolvedValue({});
    renderModal({ onSubmit });
    await selectPrescription();
    // Hold open the refetch that the successful order triggers
    getMock.mockImplementation(neverSettles);

    fireEvent.click(getButton('Send'));

    expect(await screen.findByText('Your order has been sent to pharmacy.')).toBeTruthy();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('lets the order be sent again after a failed request', async () => {
    postMock.mockRejectedValue(new Error('Network down'));
    renderModal();
    await selectPrescription();

    fireEvent.click(getButton('Send'));

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith('Network down'));
    await waitFor(() => expect(getButton('Send').disabled).toBe(false));
  });
});
