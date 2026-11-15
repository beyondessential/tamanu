import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';

import { renderElementWithTranslatedText } from '../../helpers';

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ facilityId: 'facility-1' }),
}));

const presetLabelsQuery = vi.hoisted(() => ({ hasPresetLabels: false }));
vi.mock('../../../app/utils/medications', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    buildInstructionText: () => '1 tab daily at night',
    usePresetLabelsQuery: () => presetLabelsQuery,
  };
});

const { DateTimeProviderContext } = await import('@tamanu/ui-components');
const { DispensedMedicationDetailsModal } = await import(
  '../../../app/components/Medication/DispensedMedicationDetailsModal'
);
const { NotDispensedMedicationDetailsModal } = await import(
  '../../../app/components/Medication/NotDispensedMedicationDetailsModal'
);

const dateTimeValue = {
  primaryTimeZone: 'Pacific/Auckland',
  facilityTimeZone: null,
  locale: 'en-AU',
  ...Object.fromEntries(Object.keys(dateTimeFormatters).map(name => [name, () => '01/10/25'])),
};

const translationContext = {
  getTranslation: (_stringId, fallback) => fallback,
  getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
  getReferenceDataTranslation: ({ fallback }) => fallback,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderWithDateTime = element =>
  renderElementWithTranslatedText(
    <DateTimeProviderContext.Provider value={dateTimeValue}>
      {element}
    </DateTimeProviderContext.Provider>,
    undefined,
    translationContext,
  );

const patient = { id: 'patient-1', displayId: 'TEMP001', firstName: 'Michael', lastName: 'Brown' };
const medication = { id: 'drug-1', name: 'Salbutamol 100mcg inhaler', type: 'drug' };

const buildDispensedItem = overrides => ({
  id: 'dispense-1',
  displayId: 'GH563D9',
  quantity: 16,
  instructions: 'Take with food',
  remainingRepeats: 3,
  dispensedAt: '2025-10-01 09:00:00',
  dispensedBy: { id: 'user-1', displayName: 'Bethany Peters' },
  prescription: { date: '2025-10-01 08:00:00', medication },
  medicationPresetLabel: { id: 'preset-1', code: 'PRN-PAIN' },
  patient,
  ...overrides,
});

const buildNotDispensedRecord = isDischargePrescription => ({
  id: 'request-1',
  displayId: 'GH563D9',
  remainingRepeats: 2,
  notDispensedAt: '2025-10-02 09:00:00',
  notDispensedReason: { id: 'reason-1', name: 'Out of stock' },
  prescription: { date: '2025-10-01 08:00:00', medication },
  pharmacyOrder: { isDischargePrescription, encounter: { patient } },
});

// Each column lists label/value pairs; the label is the first child of each pair.
const columnLabels = labelText => {
  const pair = screen.getByText(labelText).parentElement;
  return [...pair.parentElement.children].map(child => child.firstChild.textContent);
};

const valueOf = labelText => screen.getByText(labelText).nextSibling.textContent;

describe('DispensedMedicationDetailsModal', () => {
  beforeEach(() => {
    presetLabelsQuery.hasPresetLabels = false;
  });

  const renderModal = item =>
    renderWithDateTime(<DispensedMedicationDetailsModal open onClose={() => {}} item={item} />);

  it('lays out the fields in the designed order', () => {
    renderModal(buildDispensedItem({ isDischargePrescription: false }));

    expect(columnLabels('Patient ID')).toEqual([
      'Patient ID',
      'Medication',
      'Prescription type',
      'Date dispensed',
      'Qty dispensed',
      'Instructions',
    ]);
    expect(columnLabels('Patient name')).toEqual([
      'Patient name',
      'Prescription date',
      'Request no.',
      'Dispensed by',
      'Remaining repeats',
      'Label text',
    ]);
  });

  it.each([
    [false, 'Inpatient'],
    [true, 'Outpatient/Discharge'],
    [null, 'Inpatient'],
  ])('shows prescription type for isDischargePrescription=%s as %s', (isDischarge, expected) => {
    renderModal(buildDispensedItem({ isDischargePrescription: isDischarge }));

    expect(valueOf('Prescription type')).toBe(expected);
  });

  it('shows Preset labels after Label text only where the facility has preset labels', () => {
    presetLabelsQuery.hasPresetLabels = true;
    renderModal(buildDispensedItem({ isDischargePrescription: true }));

    expect(columnLabels('Patient name').slice(-2)).toEqual(['Label text', 'Preset labels']);
    expect(valueOf('Preset labels')).toBe('PRN-PAIN');
  });

  it('omits Preset labels where the facility has none', () => {
    renderModal(buildDispensedItem({ isDischargePrescription: true }));

    expect(screen.queryByText('Preset labels')).toBeNull();
  });
});

describe('NotDispensedMedicationDetailsModal', () => {
  const renderModal = record =>
    renderWithDateTime(
      <NotDispensedMedicationDetailsModal open onClose={() => {}} record={record} />,
    );

  it('shows prescription type third in the left column', () => {
    renderModal(buildNotDispensedRecord(false));

    expect(columnLabels('Patient ID')).toEqual([
      'Patient ID',
      'Medication',
      'Prescription type',
      'Request no.',
      'Reason not dispensed',
    ]);
  });

  it.each([
    [false, 'Inpatient'],
    [true, 'Outpatient/Discharge'],
    [null, 'Inpatient'],
  ])('shows prescription type for isDischargePrescription=%s as %s', (isDischarge, expected) => {
    renderModal(buildNotDispensedRecord(isDischarge));

    expect(valueOf('Prescription type')).toBe(expected);
  });
});
