import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { ADMINISTRATION_FREQUENCIES } from '@tamanu/constants';
import { renderElementWithTranslatedText } from '../../../helpers';
import { MarTableRow } from '../../../../app/components/Medication/Mar/MarTableRow';

vi.mock('../../../../app/api/queries/usePausesPrescriptionQuery', () => ({
  usePausesPrescriptionQuery: () => ({ data: undefined }),
}));

vi.mock('../../../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ encounter: { id: 'encounter-1' } }),
}));

vi.mock('../../../../app/components/Medication/Mar/useCanViewMedication', () => ({
  default: () => true,
}));

vi.mock('../../../../app/components/Medication/Mar/DoseCell/MarCell', () => ({
  default: () => <td />,
}));

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({ toFacilityDateTime: value => value }),
}));

const renderRow = frequency =>
  renderElementWithTranslatedText(
    <table>
      <tbody>
        <MarTableRow
          medication={{
            id: 'prescription-1',
            medication: { id: 'drug-paracetamol', name: 'Paracetamol', type: 'drug' },
            frequency,
            medicationAdministrationRecords: [],
          }}
          selectedDate={new Date('2026-11-12T08:00:00')}
          onPopperAnchorElChange={() => {}}
        />
      </tbody>
    </table>,
    undefined,
    {
      getTranslation: (_stringId, fallback) => fallback,
      getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
      translations: {},
    },
  );

describe('MarTableRow', () => {
  it('shows a STAT label on an Immediately medication', () => {
    renderRow(ADMINISTRATION_FREQUENCIES.IMMEDIATELY);
    expect(screen.queryByText('STAT')).not.toBeNull();
  });

  it('shows no STAT label on other medications', () => {
    renderRow(ADMINISTRATION_FREQUENCIES.DAILY);
    expect(screen.queryByText('STAT')).toBeNull();
  });
});
