import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { TriageWaitTimeCell } from '../../app/components/TriageWaitTimeCell';
import { renderElementWithTranslatedText } from '../helpers';

vi.mock('@tamanu/ui-components', async () => {
  const actual = await vi.importActual('@tamanu/ui-components');
  return {
    ...actual,
    useDateTime: vi.fn(() => ({
      formatTime: value => value,
      formatShortDateTime: value => value,
      storedDateTimeToEpochMilliseconds: () => Date.now(),
    })),
  };
});

const render = props =>
  renderElementWithTranslatedText(<TriageWaitTimeCell {...props} />);

describe('TriageWaitTimeCell', () => {
  const seenCellProps = {
    triageTime: '2022-01-03 08:00:00',
    closedTime: '2022-01-03 09:00:00',
    arrivalTime: '2022-01-03 08:00:00',
  };

  it('shows Active ED for observation encounters', () => {
    render({
      ...seenCellProps,
      encounterType: ENCOUNTER_TYPES.OBSERVATION,
    });

    expect(screen.getByTestId('triagecell-observation')).toBeTruthy();
    expect(screen.getByText('Active ED')).toBeTruthy();
    expect(screen.queryByText('Emerg. short stay')).toBeNull();
  });

  it('shows Emerg. short stay for emergency short stay encounters', () => {
    render({
      ...seenCellProps,
      encounterType: ENCOUNTER_TYPES.EMERGENCY,
    });

    expect(screen.getByTestId('triagecell-emergency')).toBeTruthy();
    expect(screen.getByText('Emerg. short stay')).toBeTruthy();
    expect(screen.queryByText('Active ED')).toBeNull();
  });
});
