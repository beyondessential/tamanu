import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { ADMINISTRATION_FREQUENCIES } from '@tamanu/constants';
import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';

import { renderElementWithTranslatedText } from '../../helpers';

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useApi: () => ({ get: vi.fn(), put: vi.fn() }),
  };
});

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true } }),
}));

vi.mock('../../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ encounter: { id: 'encounter-1' } }),
}));

vi.mock('../../../app/api/queries/usePausePrescriptionQuery', () => ({
  usePausePrescriptionQuery: () => ({ data: undefined, refetch: vi.fn() }),
}));

const { SettingsContext, DateTimeProviderContext } = await import('@tamanu/ui-components');
const { MedicationDetails } = await import('../../../app/components/Medication/MedicationDetails');

const dateTimeValue = {
  primaryTimeZone: 'Australia/Melbourne',
  facilityTimeZone: null,
  locale: 'en-AU',
  ...Object.fromEntries(Object.keys(dateTimeFormatters).map(name => [name, () => ''])),
  getCurrentDate: () => '2026-09-01',
  getCurrentDateTime: () => '2026-09-01 09:00:00',
  getFacilityNowDate: () => new Date('2026-09-01T09:00:00'),
  getDayBoundaries: () => null,
  toStoredDateTime: value => value,
  toFacilityDateTime: value => value,
  storedDateTimeToEpochMilliseconds: () => 0,
};

const translationContext = {
  getTranslation: (_stringId, fallback) => fallback,
  getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
  getReferenceDataTranslation: ({ fallback }) => fallback,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const buildMedication = frequency => ({
  id: 'prescription-1',
  date: '2026-09-01 09:00:00',
  startDate: '2026-09-01 09:00:00',
  frequency,
  route: 'oral',
  doseAmount: 1,
  units: 'Tablet',
  repeats: 0,
  idealTimes: ['00:00', '00:30', '01:00', '01:30'],
  medication: { id: 'drug-1', name: 'Amoxicillin 500mg capsule', type: 'drug' },
});

const renderDetails = frequency =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => undefined }}>
      <DateTimeProviderContext.Provider value={dateTimeValue}>
        <MedicationDetails
          initialMedication={buildMedication(frequency)}
          onClose={() => {}}
          onReloadTable={() => {}}
        />
      </DateTimeProviderContext.Provider>
    </SettingsContext.Provider>,
    undefined,
    translationContext,
  );

const scheduleHeading = () => screen.queryByText('Medication administration schedule');

describe('MedicationDetails', () => {
  it('shows the administration schedule when the times are selectable', () => {
    renderDetails(ADMINISTRATION_FREQUENCIES.DAILY);

    expect(scheduleHeading()).toBeTruthy();
  });

  it.each([ADMINISTRATION_FREQUENCIES.HOURLY, ADMINISTRATION_FREQUENCIES.HALF_HOURLY])(
    'hides the administration schedule for %s',
    frequency => {
      renderDetails(frequency);

      expect(scheduleHeading()).toBeNull();
    },
  );
});
