import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { DRUG_LIMIT_BREACHES, DRUG_UNITS } from '@tamanu/constants';

import {
  MedicationLimitWarning,
  renderLimitWarning,
} from '../../../app/components/Medication/MedicationLimitWarning';
import {
  createTranslationContextWithReplacements,
  renderElementWithTranslatedText,
} from '../../helpers';

const renderWarning = element =>
  renderElementWithTranslatedText(element, undefined, createTranslationContextWithReplacements());

// A breach carries the drug's unit with the limit, as getDoseLimitBreach and its sibling give it.
const aboveMax = (limit, unit) => ({ type: DRUG_LIMIT_BREACHES.ABOVE_MAX, limit, unit });
const belowMin = (limit, unit) => ({ type: DRUG_LIMIT_BREACHES.BELOW_MIN, limit, unit });

// spec: DQLIM#the-inline-warning
describe('MedicationLimitWarning', () => {
  it.each([
    [aboveMax(2, DRUG_UNITS.tablet), 'Above expected max of 2 tablets'],
    [belowMin(1, DRUG_UNITS.tablet), 'Below expected min of 1 tablet'],
    [aboveMax(3, DRUG_UNITS.blisterPack), 'Above expected max of 3 blister packs'],
    [aboveMax(500, DRUG_UNITS.ml), 'Above expected max of 500 mL'],
  ])('names the limit crossed in the drug unit', (breach, text) => {
    renderWarning(<MedicationLimitWarning breach={breach} />);

    expect(screen.getByTestId('medication-limit-warning').textContent.trim()).toBe(text);
  });

  it('gives the number alone when the drug has no unit', () => {
    renderWarning(<MedicationLimitWarning breach={aboveMax(24)} />);

    expect(screen.getByTestId('medication-limit-warning').textContent.trim()).toBe(
      'Above expected max of 24',
    );
  });

  it('renders nothing when the value is in range', () => {
    renderWarning(<MedicationLimitWarning breach={null} />);

    expect(screen.queryByTestId('medication-limit-warning')).toBeNull();
  });
});

describe('renderLimitWarning', () => {
  it('renders the warning for a limit crossed', () => {
    renderWarning(<div>{renderLimitWarning(aboveMax(2, DRUG_UNITS.tablet))}</div>);

    expect(screen.getByText('Above expected max of 2 tablets')).toBeTruthy();
  });

  it('gives nothing, so a helper text slot stays empty, when the value is in range', () => {
    expect(renderLimitWarning(null)).toBeUndefined();
  });
});
