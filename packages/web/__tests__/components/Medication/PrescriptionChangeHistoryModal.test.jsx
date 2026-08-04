import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../../helpers';
import { PrescriptionChangeHistoryModal } from '../../../app/components/Medication/PrescriptionChangeHistoryModal';

const historyData = {
  original: {
    medication: { id: 'drug-original', name: 'Paracetamol 500mg tablet', type: 'drug' },
    isVariableDose: false,
    doseAmount: 1,
    dosingUnit: 'Tablet',
    frequency: 'Every 6 hours',
    route: 'oral',
    durationValue: 1,
    durationUnit: 'months',
    notes: 'Original note',
    pharmacyNotes: null,
    quantity: 16,
    prescriber: { id: 'user-9', displayName: 'Dr Original' },
  },
  current: {
    medication: { id: 'drug-substitute', name: 'Paracetamol 250mg tablet', type: 'drug' },
    isVariableDose: false,
    doseAmount: 1,
    dosingUnit: 'Tablet',
    frequency: 'Every 6 hours',
    route: 'oral',
    durationValue: null,
    durationUnit: null,
    notes: 'Ensure taken with food in morning',
    pharmacyNotes: 'This prescription has been modified by pharmacy when dispensing.',
    quantity: 16,
    modifiedBy: { id: 'user-1', displayName: 'Catherine Jennings' },
    modifiedReason: { id: 'reason-1', name: 'Out of stock', type: 'medicationDispenseModifyReason' },
  },
};

const getMock = vi.fn().mockResolvedValue(historyData);

vi.mock('../../../app/api', () => ({
  useApi: () => ({ get: getMock }),
}));

const translationContext = {
  getTranslation: (_stringId, fallback) => fallback,
  getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
  getReferenceDataTranslation: (_stringId, fallback) => fallback,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderModal = () =>
  renderElementWithTranslatedText(
    <PrescriptionChangeHistoryModal open dispenseId="dispense-1" onClose={() => {}} />,
    undefined,
    translationContext,
  );

describe('PrescriptionChangeHistoryModal', () => {
  it('renders the current (dispensed) details from props', async () => {
    renderModal();

    const currentCard = await screen.findByTestId('modify-history-current');
    expect(within(currentCard).getByText('Paracetamol 250mg tablet')).toBeTruthy();
    expect(within(currentCard).getByText('Every 6 hours')).toBeTruthy();
    // The modification metadata is shown on the current card
    expect(within(currentCard).getByText('Catherine Jennings')).toBeTruthy();
    expect(within(currentCard).getByText('Out of stock')).toBeTruthy();
    // Current dispensing quantity is the fill's quantity
    expect(within(currentCard).getByText('16')).toBeTruthy();
  });

  it('renders the original prescription details from props', async () => {
    renderModal();

    const originalCard = await screen.findByTestId('modify-history-original');
    expect(within(originalCard).getByText('Paracetamol 500mg tablet')).toBeTruthy();
    // The original prescriber is shown only on the original card
    expect(within(originalCard).getByText('Dr Original')).toBeTruthy();
    expect(within(originalCard).getByText('Original note')).toBeTruthy();
  });
});
