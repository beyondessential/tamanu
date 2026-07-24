import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Formik, useFormikContext } from 'formik';
import { ADMINISTRATION_FREQUENCIES, MEDICATION_DURATION_UNITS } from '@tamanu/constants';

import { DispensingQuantityAutocalculator } from '../../../app/components/Medication/DispensingQuantityAutocalculator';

// The calculator renders nothing and only manipulates Formik state, so we drive it with a probe
// that both displays the current `quantity` and exposes buttons which set fields the way the real
// form inputs would. Each click lets the calculator's effects run in response.
const Probe = () => {
  const { values, setFieldValue } = useFormikContext();
  return (
    <>
      <span data-testid="quantity">{`${values.quantity}`}</span>
      <button data-testid="set-dose-500" type="button" onClick={() => setFieldValue('doseAmount', 500)}>
        dose 500
      </button>
      <button data-testid="set-dose-750" type="button" onClick={() => setFieldValue('doseAmount', 750)}>
        dose 750
      </button>
      <button data-testid="edit-quantity" type="button" onClick={() => setFieldValue('quantity', 999)}>
        manual quantity
      </button>
      <button
        data-testid="change-medication"
        type="button"
        onClick={() => setFieldValue('medicationId', 'drug-2')}
      >
        change medication
      </button>
    </>
  );
};

// Concrete worked example used throughout: DAILY = 1 dose/day, 10 days, 250 dosing units per
// dispensing unit → 500 × 1 × 10 ÷ 250 = 20 (and 750 → 30).
const baseValues = {
  medicationId: 'drug-1',
  doseAmount: '',
  unitConversion: 250,
  frequency: ADMINISTRATION_FREQUENCIES.DAILY,
  durationValue: 10,
  durationUnit: MEDICATION_DURATION_UNITS.DAYS,
  isVariableDose: false,
  isOngoing: false,
  quantity: '',
};

const renderCalculator = ({ values = {}, enabled = true, isOngoing, mounted = true } = {}) =>
  render(
    <Formik initialValues={{ ...baseValues, ...values }} onSubmit={() => {}}>
      <>
        {mounted && <DispensingQuantityAutocalculator enabled={enabled} isOngoing={isOngoing} />}
        <Probe />
      </>
    </Formik>,
  );

const quantity = () => screen.getByTestId('quantity').textContent;

describe('DispensingQuantityAutocalculator', () => {
  it('does not overwrite a pre-existing quantity on mount', () => {
    // The inputs would calculate to 20, but an existing quantity is adopted as the baseline so that
    // opening an existing prescription does not immediately recalculate it.
    renderCalculator({ values: { doseAmount: 500, quantity: 7 } });
    expect(quantity()).toBe('7');
  });

  it('auto-fills the quantity once an input changes after mount', () => {
    renderCalculator();
    expect(quantity()).toBe(''); // blank on mount
    fireEvent.click(screen.getByTestId('set-dose-500'));
    expect(quantity()).toBe('20');
  });

  it('stops recalculating once the user edits the quantity manually', () => {
    renderCalculator();
    fireEvent.click(screen.getByTestId('set-dose-500'));
    expect(quantity()).toBe('20');

    fireEvent.click(screen.getByTestId('edit-quantity'));
    expect(quantity()).toBe('999');

    // A later input change must not clobber the manual value.
    fireEvent.click(screen.getByTestId('set-dose-750'));
    expect(quantity()).toBe('999');
  });

  it('resumes autocalculation after the medication changes, discarding a manual override', () => {
    renderCalculator();
    fireEvent.click(screen.getByTestId('set-dose-500'));
    fireEvent.click(screen.getByTestId('edit-quantity'));
    expect(quantity()).toBe('999');

    // Selecting a different medication clears the manual lock; the next input change recalculates.
    fireEvent.click(screen.getByTestId('change-medication'));
    fireEvent.click(screen.getByTestId('set-dose-750'));
    expect(quantity()).toBe('30');
  });

  it('uses the isOngoing prop to override the form value (defaults to a 30-day supply)', () => {
    renderCalculator({
      values: { durationValue: '', durationUnit: '', isOngoing: false },
      isOngoing: true,
    });
    fireEvent.click(screen.getByTestId('set-dose-500'));
    expect(quantity()).toBe('60'); // 500 × 1/day × 30 days ÷ 250
  });

  describe('feature-flag gating', () => {
    it('leaves the field blank when disabled', () => {
      renderCalculator({ enabled: false });
      fireEvent.click(screen.getByTestId('set-dose-500'));
      expect(quantity()).toBe('');
    });

    it('leaves the field blank when the calculator is not mounted', () => {
      renderCalculator({ mounted: false });
      fireEvent.click(screen.getByTestId('set-dose-500'));
      expect(quantity()).toBe('');
    });
  });
});
