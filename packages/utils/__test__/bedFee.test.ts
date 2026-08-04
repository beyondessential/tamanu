import { describe, it, expect } from 'vitest';
import { computeBedFeeChargeInstants, countBedFeeNightsByLocation } from '../src';

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

describe('countBedFeeNightsByLocation', () => {
  const nights = (map: Map<string, number>) => Object.fromEntries(map);

  it('attributes every night to the current location when there is no change history', () => {
    const result = countBedFeeNightsByLocation(
      ['2024-06-17 02:00:00', '2024-06-18 02:00:00'],
      [],
      'loc-current',
    );
    expect(nights(result)).toEqual({ 'loc-current': 2 });
  });

  it('attributes each night to the location occupied at that instant across a mid-stay move', () => {
    const result = countBedFeeNightsByLocation(
      ['2024-06-17 02:00:00', '2024-06-18 02:00:00', '2024-06-19 02:00:00'],
      [
        { date: '2024-06-16 18:00:00', locationId: 'loc-a' },
        { date: '2024-06-17 12:00:00', locationId: 'loc-b' },
      ],
      'loc-b',
    );
    // 17th check precedes the move → loc-a; 18th + 19th → loc-b.
    expect(nights(result)).toEqual({ 'loc-a': 1, 'loc-b': 2 });
  });

  it('follows a move that precedes every instant (early ward move)', () => {
    const result = countBedFeeNightsByLocation(
      ['2024-06-16 14:00:00'],
      [
        { date: '2024-06-16 09:00:00', locationId: 'loc-a' },
        { date: '2024-06-16 11:00:00', locationId: 'loc-b' },
      ],
      'loc-b',
    );
    expect(nights(result)).toEqual({ 'loc-b': 1 });
  });

  it('skips instants that resolve to no location', () => {
    const result = countBedFeeNightsByLocation(['2024-06-17 02:00:00'], [], null);
    expect(nights(result)).toEqual({});
  });

  it('returns an empty tally when there are no charge instants', () => {
    const result = countBedFeeNightsByLocation(
      [],
      [{ date: '2024-06-16 18:00:00', locationId: 'loc-a' }],
      'loc-a',
    );
    expect(nights(result)).toEqual({});
  });
});
