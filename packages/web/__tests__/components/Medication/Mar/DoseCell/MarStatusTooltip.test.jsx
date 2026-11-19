import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DRUG_UNITS } from '@tamanu/constants';
import { renderElementWithTranslatedText } from '../../../../helpers';
import { MarStatusLabel } from '../../../../../app/components/Medication/Mar/DoseCell/MarStatusTooltip';

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({ formatTime: () => '1:00pm' }),
  PlainTimeDisplay: ({ time }) => time,
}));

const getTranslation = (_stringId, fallback, { replacements } = {}) =>
  fallback.replace(/:(\w+)/g, (token, key) => replacements?.[key] ?? token);

const renderLabelLines = props => {
  const { container } = renderElementWithTranslatedText(
    <MarStatusLabel
      doseAmount={1000}
      dosingUnit={DRUG_UNITS.mg}
      dueAt="2026-11-20 13:00:00"
      marInfo={{ dueAt: '2026-11-20 13:00:00' }}
      {...props}
    />,
    undefined,
    {
      getTranslation,
      getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
      translations: {},
    },
  );
  const tooltipText = container.firstChild.firstChild;
  return [...tooltipText.children].map(line => line.textContent.replace(/\s+/g, ' '));
};

describe('MarStatusLabel', () => {
  it('shows the dose window and amount for a due sub-slot dose', () => {
    expect(renderLabelLines({ doseWindow: { startTime: '13:00', endTime: '14:00' } })).toEqual([
      '13:00–14:00',
      '1000 mg',
      'Due at 1:00pm.',
    ]);
  });

  it('shows the dose window and amount for missed and future sub-slot doses', () => {
    const doseWindow = { startTime: '13:00', endTime: '13:30' };
    expect(renderLabelLines({ doseWindow, isPast: true })).toEqual([
      '13:00–13:30',
      '1000 mg',
      'Missed. Due at 1:00pm.',
    ]);
    expect(renderLabelLines({ doseWindow, isNotDue: true })).toEqual([
      '13:00–13:30',
      '1000 mg',
      'Cannot record future dose. Due at 1:00pm.',
    ]);
  });

  it('shows midnight for a window ending at 24:00', () => {
    expect(renderLabelLines({ doseWindow: { startTime: '23:00', endTime: '24:00' } })).toEqual([
      '23:00–00:00',
      '1000 mg',
      'Due at 1:00pm.',
    ]);
  });

  it('leaves out the amount for a variable dose', () => {
    expect(
      renderLabelLines({
        doseWindow: { startTime: '13:00', endTime: '14:00' },
        isVariableDose: true,
      }),
    ).toEqual(['13:00–14:00', 'Due at 1:00pm.']);
  });

  it('shows the amount without a unit when the prescription has none', () => {
    expect(
      renderLabelLines({ doseWindow: { startTime: '13:00', endTime: '14:00' }, dosingUnit: null }),
    ).toEqual(['13:00–14:00', '1000', 'Due at 1:00pm.']);
  });

  it('shows only the due time without a dose window', () => {
    expect(renderLabelLines({})).toEqual(['Due at 1:00pm.']);
  });
});
