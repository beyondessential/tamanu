import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ADMINISTRATION_FREQUENCIES, MEDICATION_DURATION_UNITS } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../../helpers';
import { MedicationSetMedicationsList } from '../../../app/components/Medication/MedicationSetList';

vi.mock('../../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ encounter: { id: 'enc-1' } }),
}));

vi.mock('../../../app/api/queries/useEncounterMedicationQuery', () => ({
  useEncounterMedicationQuery: () => ({ data: { data: [] } }),
}));

const translationContext = {
  // Mirror the real helper closely enough to resolve `:token` replacements in fallbacks.
  getTranslation: (_stringId, fallback, options) =>
    Object.entries(options?.replacements ?? {}).reduce(
      (text, [key, value]) => text.replaceAll(`:${key}`, `${value}`),
      fallback,
    ),
  getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const buildChild = overrides => ({
  medication: { id: 'drug-1', name: 'Paracetamol' },
  route: 'oral',
  frequency: ADMINISTRATION_FREQUENCIES.DAILY,
  notes: '',
  durationUnit: MEDICATION_DURATION_UNITS.DAYS,
  durationValue: 10,
  isPrn: false,
  isOngoing: false,
  doseAmount: 500,
  dosingUnit: 'mg',
  quantity: 20,
  dispensingUnit: 'Tablet',
  ...overrides,
});

const renderList = children =>
  renderElementWithTranslatedText(
    <MedicationSetMedicationsList medicationSet={{ name: 'Sepsis bundle', children }} />,
    undefined,
    translationContext,
  );

describe('MedicationSetMedicationsList dispensing quantity summary', () => {
  it('shows the autocalculated dispensing quantity and unit for a medication', () => {
    renderList([buildChild({ quantity: 20, dispensingUnit: 'Tablet' })]);
    expect(screen.getByText(/Dispensing quantity: 20/)).toBeTruthy();
  });

  it('omits the dispensing quantity line when there is no quantity', () => {
    renderList([buildChild({ quantity: null })]);
    expect(screen.queryByText(/Dispensing quantity/)).toBeNull();
  });

  it('shows the quantity without a unit when the drug has no reference drug (blank dispensing unit)', () => {
    // A medication whose reference drug data is missing falls back to a blank dispensing unit; the
    // quantity still shows, just without a trailing unit label.
    renderList([buildChild({ quantity: 15, dispensingUnit: '' })]);
    expect(screen.getByText('Dispensing quantity: 15')).toBeTruthy();
  });
});
