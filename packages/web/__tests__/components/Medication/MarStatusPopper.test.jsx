import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../../helpers';
import { GivenScreen } from '../../../app/components/Medication/Mar/StatusPopper';

// The give-dose screen reads the prescription's dosingUnit twice: to size the number input's
// padding (a styled-components interpolation that only fires on render) and to render the unit
// suffix. When a drug has no dosing unit the API strips the null column, so dosingUnit arrives
// as undefined (or null on paths that keep it). These stubs keep the render light while leaving
// the real StyledNumberFieldWrapper interpolation and the unit-suffix branch exercised.
vi.mock('../../../app/api/mutations/useMarMutation', () => ({
  useGivenMarMutation: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useNotGivenMarMutation: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

vi.mock('../../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ encounter: { id: 'encounter-1' } }),
}));

// The Time given picker pulls in the MUI date-time adapter; stub it to a plain input so the test
// stays focused on the dose-unit rendering.
vi.mock('../../../app/components/Field/TimePickerField', () => ({
  TimePickerField: () => <input data-testid="time-given-input" readOnly />,
}));

// useDateTime throws outside a DateTimeProvider; the give-dose screen only needs a "now" date and
// a pass-through storage converter for its initial values. NumberField is stubbed to a plain input
// (the real one reaches for SettingsContext) — the crash under test is in the StyledNumberFieldWrapper
// that surrounds it, not in the field itself.
vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDateTime: () => ({
      getFacilityNowDate: () => new Date('2026-08-31T08:30:00'),
      toStoredDateTime: value => value,
    }),
    NumberField: ({ field }) => (
      <input data-testid="dose-amount-input" value={field?.value ?? ''} readOnly />
    ),
  };
});

const renderGivenScreen = (props = {}) =>
  renderElementWithTranslatedText(
    <GivenScreen
      doseAmount={5}
      timeSlot={{ startTime: '08:00' }}
      selectedDate="2026-08-31"
      marId="mar-1"
      dosingUnit="mg"
      onClose={() => {}}
      prescriptionId="prescription-1"
      isFuture={false}
      isPast={false}
      isVariableDose={false}
      {...props}
    />,
  );

describe('MAR give-dose screen dosing unit', () => {
  // The crash was `Cannot read properties of undefined (reading 'length')` thrown from the padding
  // interpolation during render. The API strips null columns, so the frontend receives undefined;
  // some paths keep it as null. Both must render without throwing.
  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('renders without throwing when the drug has no dosing unit (%s)', (_label, dosingUnit) => {
    expect(() => renderGivenScreen({ dosingUnit })).not.toThrow();
  });

  it('shows no unit suffix, and no "Unknown" placeholder, when there is no dosing unit', () => {
    renderGivenScreen({ dosingUnit: undefined });
    // TranslatedEnum renders "Unknown" for an absent enum value; the suffix branch must be gated
    // off entirely rather than falling through to it.
    expect(screen.queryByText('Unknown')).toBeNull();
  });

  it('still shows the correct unit suffix when the drug has a dosing unit', () => {
    renderGivenScreen({ dosingUnit: 'mg' });
    expect(screen.getByText('mg')).toBeTruthy();
  });
});
