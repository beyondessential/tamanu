import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { DateTimeProviderContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers';

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ facilityId: 'facility-1' }),
}));

// Preset labels are a separate query with its own facility fetch; the details modal only uses
// the flag to decide whether to render that row.
vi.mock('../../../app/utils/medications', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, usePresetLabelsQuery: () => ({ hasPresetLabels: false }) };
});

const { DispensedMedicationDetailsModal } = await import(
  '../../../app/components/Medication/DispensedMedicationDetailsModal'
);

const translationContext = {
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

const dateTimeContext = {
  formatShort: date => `short(${date})`,
  formatShortest: date => `shortest(${date})`,
};

const buildItem = ({ discontinued = false } = {}) => ({
  id: 'dispense-1',
  displayId: 'XQFG4BS',
  quantity: 2,
  instructions: 'Take after food',
  remainingRepeats: 0,
  dispensedAt: '2026-08-13 11:00:00',
  dispensedBy: { displayName: 'Initial Admin' },
  medication: { id: 'drug-1', name: 'Anastrozole 1mg Tablets', type: 'drug' },
  prescription: {
    id: 'p1',
    date: '2026-08-12 09:00:00',
    discontinued,
    discontinuedDate: discontinued ? '2026-08-12 15:00:00' : null,
    discontinuingReason: discontinued ? 'Patient reaction' : null,
    medication: { id: 'drug-1', name: 'Anastrozole 1mg Tablets', type: 'drug' },
  },
  patient: { displayId: 'HSHF084352', firstName: 'sepi', lastName: 'test6' },
});

const renderModal = item =>
  renderElementWithTranslatedText(
    <DateTimeProviderContext.Provider value={dateTimeContext}>
      <DispensedMedicationDetailsModal open onClose={() => {}} item={item} />
    </DateTimeProviderContext.Provider>,
    undefined,
    translationContext,
  );

// The modal reads the medication from the dispense but the discontinued flag from the
// prescription behind it, so this covers that it passes the right object through (spec: PHDIS).
describe('DispensedMedicationDetailsModal', () => {
  it('flags a fill dispensed against a discontinued prescription', () => {
    renderModal(buildItem({ discontinued: true }));
    expect(screen.getByText('Discontinued')).toBeDefined();
  });

  it('does not flag a fill whose prescription is still active', () => {
    renderModal(buildItem());
    expect(screen.queryByText('Discontinued')).toBeNull();
  });

  it('still shows the dispensed medication name when discontinued', () => {
    renderModal(buildItem({ discontinued: true }));
    expect(screen.getByText('Anastrozole 1mg Tablets')).toBeDefined();
  });
});
