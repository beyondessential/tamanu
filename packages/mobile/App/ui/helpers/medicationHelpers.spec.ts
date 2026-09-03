import { ADMINISTRATION_FREQUENCY_DETAILS } from '@tamanu/constants';
import { ADMINISTRATION_FREQUENCIES } from '~/constants/medications';
import { getDefaultIdealTimes } from './medicationHelpers';

describe('getDefaultIdealTimes', () => {
  it('uses the configured times for a frequency a deployment can customise', () => {
    const configured = { [ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY]: ['07:00', '19:00'] };

    expect(
      getDefaultIdealTimes(ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY, configured),
    ).toEqual(['07:00', '19:00']);
  });

  it('falls back to the fixed times when a customisable frequency is unset', () => {
    expect(getDefaultIdealTimes(ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY, {})).toEqual(
      ADMINISTRATION_FREQUENCY_DETAILS[ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY].startTimes,
    );
  });

  // Central resolves settings from a schema that excludes these, so the object mobile receives
  // simply has no entry for them — the regression this helper exists to prevent.
  it.each([
    [ADMINISTRATION_FREQUENCIES.HOURLY, 24],
    [ADMINISTRATION_FREQUENCIES.HALF_HOURLY, 48],
  ])('resolves %s to its %i fixed administration times', (frequency, expectedCount) => {
    const idealTimes = getDefaultIdealTimes(frequency, {});

    expect(idealTimes).toEqual(ADMINISTRATION_FREQUENCY_DETAILS[frequency].startTimes);
    expect(idealTimes).toHaveLength(expectedCount);
  });

  it.each([ADMINISTRATION_FREQUENCIES.HOURLY, ADMINISTRATION_FREQUENCIES.HALF_HOURLY])(
    'ignores a stale configured value for %s',
    frequency => {
      expect(getDefaultIdealTimes(frequency, { [frequency]: ['09:00'] })).toEqual(
        ADMINISTRATION_FREQUENCY_DETAILS[frequency].startTimes,
      );
    },
  );

  it.each([ADMINISTRATION_FREQUENCIES.IMMEDIATELY, ADMINISTRATION_FREQUENCIES.AS_DIRECTED])(
    'returns no times for %s, which has no schedule',
    frequency => {
      expect(getDefaultIdealTimes(frequency, {})).toEqual([]);
    },
  );

  it('falls back to the fixed times when settings have not loaded', () => {
    expect(getDefaultIdealTimes(ADMINISTRATION_FREQUENCIES.DAILY, undefined)).toEqual(
      ADMINISTRATION_FREQUENCY_DETAILS[ADMINISTRATION_FREQUENCIES.DAILY].startTimes,
    );
  });
});
