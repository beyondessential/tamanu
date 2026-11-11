import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { DRUG_LIMIT_BREACHES, DRUG_UNITS } from '@tamanu/constants';

import {
  DoseLimitWarning,
  MedicationLimitWarning,
} from '../../../app/components/Medication/MedicationLimitWarning';
import {
  createTranslationContextWithReplacements,
  renderElementWithTranslatedText,
} from '../../helpers';

const renderWarning = element =>
  renderElementWithTranslatedText(element, undefined, createTranslationContextWithReplacements());

const aboveMax = limit => ({ type: DRUG_LIMIT_BREACHES.ABOVE_MAX, limit });
const belowMin = limit => ({ type: DRUG_LIMIT_BREACHES.BELOW_MIN, limit });

// spec: DQLIM#the-inline-warning
describe('MedicationLimitWarning', () => {
  it.each([
    [aboveMax(2), DRUG_UNITS.tablet, 'Above expected max of 2 tablets'],
    [belowMin(1), DRUG_UNITS.tablet, 'Below expected min of 1 tablet'],
    [aboveMax(3), DRUG_UNITS.blisterPack, 'Above expected max of 3 blister packs'],
    [aboveMax(500), DRUG_UNITS.ml, 'Above expected max of 500 mL'],
  ])('names the limit crossed in the drug unit', (breach, unit, text) => {
    renderWarning(<MedicationLimitWarning breach={breach} unit={unit} />);

    expect(screen.getByTestId('medication-limit-warning').textContent.trim()).toBe(text);
  });

  it('gives the number alone when the drug has no unit', () => {
    renderWarning(<MedicationLimitWarning breach={aboveMax(24)} />);

    expect(screen.getByTestId('medication-limit-warning').textContent.trim()).toBe(
      'Above expected max of 24',
    );
  });

  it('renders nothing when the value is in range', () => {
    renderWarning(<MedicationLimitWarning breach={null} unit="Tablet" />);

    expect(screen.queryByTestId('medication-limit-warning')).toBeNull();
  });
});

describe('DoseLimitWarning', () => {
  const referenceDrug = { doseMin: '1', doseMax: '2' };

  it('checks the dose against the dose limits', () => {
    renderWarning(
      <DoseLimitWarning doseAmount={10} referenceDrug={referenceDrug} dosingUnit="Tablet" />,
    );

    expect(screen.getByText('Above expected max of 2 tablets')).toBeTruthy();
  });

  it('never flags a variable dose', () => {
    renderWarning(
      <DoseLimitWarning
        doseAmount={10}
        isVariableDose
        referenceDrug={referenceDrug}
        dosingUnit="Tablet"
      />,
    );

    expect(screen.queryByTestId('medication-limit-warning')).toBeNull();
  });
});
