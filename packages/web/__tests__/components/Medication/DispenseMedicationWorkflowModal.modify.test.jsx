import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';

import { DRUG_STOCK_STATUS_LABELS, DRUG_STOCK_STATUSES } from '@tamanu/constants';
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

const stockedAs = (stockStatus, quantity) => ({
  facilities: [{ facilityId: FACILITY_ID, stockStatus, quantity }],
});

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
    medicationId: 'drug-1',
    medication: {
      id: 'drug-1',
      name: 'Amoxicillin 500mg capsule',
      type: 'drug',
      referenceDrug: stockedAs(DRUG_STOCK_STATUSES.IN_STOCK, 20),
    },
  },
};

const substitution = {
  medicationId: 'drug-2',
  medication: {
    id: 'drug-2',
    name: 'Cefalexin 250mg capsule',
    referenceDrug: stockedAs(DRUG_STOCK_STATUSES.OUT_OF_STOCK, 0),
  },
  dosingUnit: 'Capsule',
  dispensingUnit: 'Capsule',
  quantity: 12,
  labelNotes: 'Take 1 capsule three times daily',
};

const getMock = vi.fn();

const suggester = {
  fetchSuggestions: async () => [],
  fetchCurrentOption: async () => null,
};

vi.mock('../../../app/components/Medication/ModifyPrescriptionModal', () => ({
  ModifyPrescriptionModal: ({ onConfirm }) => (
    <button type="button" onClick={() => onConfirm(substitution)}>
      Confirm modification
    </button>
  ),
}));

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

const renderModal = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ThemeProvider theme={createStubTheme()}>
        <SettingsContext.Provider value={{ getSetting: () => undefined }}>
          <TranslationProvider value={translationContext}>
            <DispenseMedicationWorkflowModal open onClose={() => {}} patient={PATIENT} />
          </TranslationProvider>
        </SettingsContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

const quantityInput = () => screen.getByTestId('dispense-quantity').querySelector('input');

const substituteDrug = async () => {
  fireEvent.click(await screen.findByTestId('dispense-row-actions-0'));
  fireEvent.click(await screen.findByText('Modify prescription'));
  fireEvent.click(await screen.findByText('Confirm modification'));
};

describe('DispenseMedicationWorkflowModal after Modify prescription', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockImplementation(async endpoint => {
      if (endpoint === 'medication/dispensable-medications') return { data: [dispensableItem] };
      return { data: [] };
    });
  });

  it('shows the modified quantity in the row', async () => {
    renderModal();
    expect(await screen.findByText('Amoxicillin 500mg capsule')).toBeTruthy();
    expect(quantityInput().value).toBe('4');

    await substituteDrug();

    expect(await screen.findByText('Cefalexin 250mg capsule')).toBeTruthy();
    expect(quantityInput().value).toBe('12');
  });

  it('shows the stock status of the substituted drug', async () => {
    renderModal();
    const { in_stock: inStock, out_of_stock: outOfStock } = DRUG_STOCK_STATUS_LABELS;
    expect(await screen.findByText(inStock)).toBeTruthy();

    await substituteDrug();

    expect(await screen.findByText(outOfStock)).toBeTruthy();
    expect(screen.queryByText(inStock)).toBeNull();
  });

  it('shows the label notes entered in the modal as the label text', async () => {
    renderModal();
    await screen.findByText('Amoxicillin 500mg capsule');

    await substituteDrug();

    expect(await screen.findByDisplayValue(substitution.labelNotes)).toBeTruthy();
  });
});
