import { describe, expect, it } from 'vitest';

import { ADMINISTRATION_FREQUENCIES } from '@tamanu/constants';
import { compareMarMedications } from '../../../../app/components/Medication/Mar/marOrder';

const { IMMEDIATELY, DAILY } = ADMINISTRATION_FREQUENCIES;

describe('compareMarMedications', () => {
  it('lists active STAT medications first, then other active ones, then discontinued ones', () => {
    // Already in prescription date order, as the API returns them
    const medications = [
      { id: 'daily-1', frequency: DAILY },
      { id: 'stat-discontinued', frequency: IMMEDIATELY, discontinued: true },
      { id: 'stat-1', frequency: IMMEDIATELY },
      { id: 'daily-discontinued', frequency: DAILY, discontinued: true },
      { id: 'daily-2', frequency: DAILY, discontinued: false },
      { id: 'stat-2', frequency: IMMEDIATELY, discontinued: null },
    ];

    expect(medications.toSorted(compareMarMedications).map(({ id }) => id)).toEqual([
      'stat-1',
      'stat-2',
      'daily-1',
      'daily-2',
      'stat-discontinued',
      'daily-discontinued',
    ]);
  });
});
