import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ADMINISTRATION_FREQUENCIES, DRUG_UNITS } from '@tamanu/constants';
import { renderElementWithTranslatedText } from '../../../../helpers';
import MarCell from '../../../../../app/components/Medication/Mar/DoseCell/MarCell';

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({
    formatTime: () => '1:00pm',
    getFacilityNowDate: () => new Date('2026-11-20T08:00:00'),
    storedDateTimeToEpochMilliseconds: value => new Date(value).getTime(),
    toFacilityDateTime: value => value,
  }),
  PlainTimeDisplay: ({ time }) => time,
}));
vi.mock('../../../../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ encounter: { id: 'encounter-1' } }),
}));
vi.mock('../../../../../app/components/Medication/Mar/useCanViewMedication', () => ({
  default: () => true,
}));
vi.mock('../../../../../app/components/Medication/Mar/useIsCurrentTimeSlot', () => ({
  useIsCurrentTimeSlot: () => false,
}));
vi.mock('../../../../../app/components/Medication/Mar/useMarDoses', () => ({
  default: () => ({ data: [] }),
}));
vi.mock('../../../../../app/components/Medication/Mar/DoseCell/useMarPermissions', () => ({
  default: () => ({ canCreateMar: true, canViewMar: true }),
}));
vi.mock('../../../../../app/components/Medication/Mar/DoseCell/useMarDoseAlerts', () => ({
  default: () => ({}),
}));
vi.mock('../../../../../app/components/Medication/Mar/DoseCell/useMarStatusFlags', () => ({
  useMarDoseScheduleStatus: () => ({ isDiscontinued: false, isEnd: false, isPaused: false }),
}));
vi.mock('../../../../../app/components/Medication/Mar/DoseCell/MarDoseStatus', () => ({
  default: () => null,
}));
vi.mock('../../../../../app/components/Medication/Mar/DoseCell/MarDoseInfoOverlay', () => ({
  default: () => null,
}));
vi.mock('../../../../../app/components/Medication/Mar/DoseCell/StatusPopper', () => ({
  StatusPopper: () => null,
}));
vi.mock('../../../../../app/components/Medication/Mar/MarDetails/MarDetails', () => ({
  MarDetails: () => null,
}));
vi.mock('../../../../../app/components/Medication/WarningModal', () => ({
  WarningModal: () => null,
}));

const hourlyMarInfos = [
  { id: 'mar-1', dueAt: '2026-11-20 12:00:00' },
  { id: 'mar-2', dueAt: '2026-11-20 13:00:00' },
];

const renderCellLabels = (medication, marInfos) => {
  const { container } = renderElementWithTranslatedText(
    <MarCell
      selectedDate={new Date('2026-11-20T00:00:00')}
      timeSlot={{ startTime: '12:00', endTime: '14:00' }}
      marInfos={marInfos}
      nextWindowMarInfos={[]}
      medication={{ doseAmount: 1000, dosingUnit: DRUG_UNITS.mg, ...medication }}
      pauseRecords={[]}
      anchorEl={null}
      onAnchorElChange={() => {}}
    />,
    undefined,
    {
      getTranslation: (_stringId, fallback, { replacements } = {}) =>
        fallback.replace(/:(\w+)/g, (token, key) => replacements?.[key] ?? token),
      getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
      translations: {},
    },
  );
  return [...container.querySelectorAll('button')].map(button =>
    [...button.firstChild.firstChild.children].map(line => line.textContent.replace(/\s+/g, ' ')),
  );
};

describe('MarCell', () => {
  it('labels each hourly dose with its sub-slot window and amount', () => {
    expect(
      renderCellLabels({ frequency: ADMINISTRATION_FREQUENCIES.HOURLY }, hourlyMarInfos),
    ).toEqual([
      ['12:00–13:00', '1000 mg', 'Cannot record future dose. Due at 1:00pm.'],
      ['13:00–14:00', '1000 mg', 'Cannot record future dose. Due at 1:00pm.'],
    ]);
  });

  it('leaves the amount off an hourly variable dose', () => {
    expect(
      renderCellLabels(
        {
          doseAmount: null,
          frequency: ADMINISTRATION_FREQUENCIES.HOURLY,
          isVariableDose: true,
        },
        hourlyMarInfos,
      ),
    ).toEqual([
      ['12:00–13:00', 'Cannot record future dose. Due at 1:00pm.'],
      ['13:00–14:00', 'Cannot record future dose. Due at 1:00pm.'],
    ]);
  });

  it('labels a classic frequency dose with its due time only', () => {
    expect(
      renderCellLabels({ frequency: ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY }, [
        { id: 'mar-1', dueAt: '2026-11-20 12:00:00' },
      ]),
    ).toEqual([['Cannot record future dose. Due at 1:00pm.']]);
  });
});
