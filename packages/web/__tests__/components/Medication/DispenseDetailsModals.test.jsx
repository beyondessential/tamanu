import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';

import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';

import { renderElementWithTranslatedText } from '../../helpers';

vi.mock('../../../app/utils/medications', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    buildInstructionText: () => '1 tab daily at night',
  };
});

// Stands in for the two-column layout so the tests read each column's fields
// without depending on how MedicationDetailsColumns arranges its markup.
vi.mock('../../../app/components/Medication/MedicationDetailsColumns', () => {
  const Column = ({ testId, details }) => (
    <dl data-testid={testId}>
      {details.map((detail, index) => (
        <div key={index} data-testid="detail">
          <dt>{detail.label}</dt>
          <dd>{detail.value}</dd>
        </div>
      ))}
    </dl>
  );
  return {
    MedicationDetailsColumns: ({ leftDetails, rightDetails }) => (
      <>
        <Column testId="left-column" details={leftDetails} />
        <Column testId="right-column" details={rightDetails} />
      </>
    ),
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

const columnLabels = columnTestId =>
  within(screen.getByTestId(columnTestId))
    .getAllByRole('term')
    .map(term => term.textContent);

const valueOf = labelText => {
  const detail = screen.getByText(labelText).closest('[data-testid="detail"]');
  return within(detail).getByRole('definition').textContent;
};

describe('DispensedMedicationDetailsModal', () => {
  const renderModal = item =>
    renderWithDateTime(<DispensedMedicationDetailsModal open onClose={() => {}} item={item} />);

  it('lays out the fields in the designed order', () => {
    renderModal(buildDispensedItem({ isDischargePrescription: false }));

    expect(columnLabels('left-column')).toEqual([
      'Patient ID',
      'Medication',
      'Prescription type',
      'Date dispensed',
      'Qty dispensed',
      'Instructions',
    ]);
    expect(columnLabels('right-column')).toEqual([
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
    // TODO(TAM-7087): pending product owner confirmation of the no-recorded-type reading.
    [null, 'Inpatient'],
  ])('shows prescription type for isDischargePrescription=%s as %s', (isDischarge, expected) => {
    renderModal(buildDispensedItem({ isDischargePrescription: isDischarge }));

    expect(valueOf('Prescription type')).toBe(expected);
  });

  it('does not show Preset labels, even for a dispense that used a preset', () => {
    renderModal(
      buildDispensedItem({
        isDischargePrescription: true,
        medicationPresetLabel: { id: 'preset-1', code: 'PRN-PAIN' },
      }),
    );

    expect(screen.queryByText('Preset labels')).toBeNull();
    expect(screen.queryByText('PRN-PAIN')).toBeNull();
  });
});

describe('NotDispensedMedicationDetailsModal', () => {
  const renderModal = record =>
    renderWithDateTime(
      <NotDispensedMedicationDetailsModal open onClose={() => {}} record={record} />,
    );

  it('shows prescription type third in the left column', () => {
    renderModal(buildNotDispensedRecord(false));

    expect(columnLabels('left-column')).toEqual([
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
    // TODO(TAM-7087): pending product owner confirmation of the no-recorded-type reading.
    [null, 'Inpatient'],
  ])('shows prescription type for isDischargePrescription=%s as %s', (isDischarge, expected) => {
    renderModal(buildNotDispensedRecord(isDischarge));

    expect(valueOf('Prescription type')).toBe(expected);
  });
});
