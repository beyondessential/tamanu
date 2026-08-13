import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { DateTimeProviderContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../helpers';
import { DiscontinuedTag, DispensedMedicationName } from '../../app/utils/medications';

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

// DiscontinuedTag reads formatShort from the datetime context, so stub just that formatter.
const dateTimeContext = { formatShort: date => `formatted(${date})` };

const renderTag = prescription =>
  renderElementWithTranslatedText(
    <DateTimeProviderContext.Provider value={dateTimeContext}>
      <DiscontinuedTag prescription={prescription} />
    </DateTimeProviderContext.Provider>,
    undefined,
    translationContext,
  );

describe('DiscontinuedTag', () => {
  it('renders nothing for a prescription that has not been discontinued', () => {
    const { container } = renderTag({ id: 'p1', discontinued: false });
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when there is no prescription', () => {
    const { container } = renderTag(undefined);
    expect(container.innerHTML).toBe('');
  });

  it('flags a discontinued prescription', () => {
    renderTag({ id: 'p1', discontinued: true });
    expect(screen.getByText('Discontinued')).toBeDefined();
  });

  it('still flags a discontinued prescription with no date or reason recorded', () => {
    renderTag({ id: 'p1', discontinued: true, discontinuedDate: null, discontinuingReason: null });
    expect(screen.getByText('Discontinued')).toBeDefined();
  });
});

const buildDispense = ({ discontinued = false, modifiedAt = null } = {}) => ({
  id: 'dispense-1',
  modifiedAt,
  pharmacyOrderPrescription: {
    prescription: {
      id: 'p1',
      discontinued,
      medication: { id: 'drug-1', name: 'Anastrozole 1mg Tablets', type: 'drug' },
    },
  },
});

const renderDispensedName = dispense =>
  renderElementWithTranslatedText(
    <DateTimeProviderContext.Provider value={dateTimeContext}>
      <DispensedMedicationName dispense={dispense} />
    </DateTimeProviderContext.Provider>,
    undefined,
    translationContext,
  );

// A prescription can be discontinued after the fill was dispensed, so the dispensed-medication
// surfaces carry the same flag as the queue (spec: PHDIS).
describe('DispensedMedicationName', () => {
  it('flags a fill dispensed against a discontinued prescription', () => {
    renderDispensedName(buildDispense({ discontinued: true }));
    expect(screen.getByText('Discontinued')).toBeDefined();
  });

  it('does not flag a fill whose prescription is still active', () => {
    renderDispensedName(buildDispense());
    expect(screen.queryByText('Discontinued')).toBeNull();
  });

  it('keeps the pharmacy-modified asterisk alongside the discontinued tag', () => {
    const { container } = renderDispensedName(
      buildDispense({ discontinued: true, modifiedAt: '2026-08-12 10:00:00' }),
    );
    expect(screen.getByText('Discontinued')).toBeDefined();
    expect(container.textContent).toContain('*');
  });
});
