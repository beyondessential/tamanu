import { describe, it, expect } from 'vitest';
import { computeBedFeeChargeInstants } from '../src';

const base = {
  overnightChargeTime: '02:00',
  primaryTimeZone: 'UTC',
  facilityTimeZone: null,
};

describe('computeBedFeeChargeInstants', () => {
  it('charges one night for a same-day admit/discharge before the first overnight check', () => {
    const instants = computeBedFeeChargeInstants({
      ...base,
      startDateTime: '2024-06-16 09:00:00',
      endDateTime: '2024-06-16 14:00:00',
    });
    expect(instants).toEqual(['2024-06-16 14:00:00']); // falls back to the end-of-stay instant (current location)
  });

  it('charges one night for a single overnight stay', () => {
    const instants = computeBedFeeChargeInstants({
      ...base,
      startDateTime: '2024-06-16 18:00:00',
      endDateTime: '2024-06-17 10:00:00',
    });
    expect(instants).toEqual(['2024-06-17 02:00:00']);
  });

  it('charges N nights for an N-night stay (one per overnight check)', () => {
    const instants = computeBedFeeChargeInstants({
      ...base,
      startDateTime: '2024-06-16 18:00:00',
      endDateTime: '2024-06-19 06:00:00',
    });
    expect(instants).toEqual([
      '2024-06-17 02:00:00',
      '2024-06-18 02:00:00',
      '2024-06-19 02:00:00',
    ]);
  });

  it('does not count an overnight check that has not yet occurred', () => {
    const instants = computeBedFeeChargeInstants({
      ...base,
      startDateTime: '2024-06-16 18:00:00',
      endDateTime: '2024-06-17 01:00:00', // before the 02:00 check
    });
    expect(instants).toEqual(['2024-06-17 01:00:00']); // min one night, anchored to the end of the stay
  });

  it('counts an overnight check on the admission day itself (charge the night admitted in)', () => {
    // Admitted at 01:00, before the 02:00 check — the same-day 02:00 counts.
    const instants = computeBedFeeChargeInstants({
      ...base,
      startDateTime: '2024-06-16 01:00:00',
      endDateTime: '2024-06-17 10:00:00',
    });
    expect(instants).toEqual(['2024-06-16 02:00:00', '2024-06-17 02:00:00']);
  });

  it('evaluates the overnight check in facility-local time and returns instants in the primary timezone', () => {
    // Facility at +11:00; admit 16:00 UTC June 16 = 03:00 June 17 local. End 16:00 UTC June 17 = 03:00 June 18 local.
    // The only 02:00-local check in range is 02:00 June 18 local = 15:00 June 17 UTC.
    const instants = computeBedFeeChargeInstants({
      overnightChargeTime: '02:00',
      primaryTimeZone: 'UTC',
      facilityTimeZone: '+11:00',
      startDateTime: '2024-06-16 16:00:00',
      endDateTime: '2024-06-17 16:00:00',
    });
    expect(instants).toEqual(['2024-06-17 15:00:00']);
  });
});
