import { describe, expect, it } from 'vitest';

import { estimateWardPresence } from '../../src/utils/dietSummary/estimateWardPresence';

const ward = (firstName, lastName) => ({ patients: [{ firstName, lastName }] });

describe('estimateWardPresence', () => {
  it('asks for more room when the first name wraps than when it does not', () => {
    const short = estimateWardPresence(ward('Sione', 'Tupou'), false);
    const long = estimateWardPresence(
      ward('Anamarituraaliatangi', 'Fonuaimoanaatuituimatangi'),
      false,
    );

    expect(long).toBeGreaterThan(short);
  });

  it('asks for more room under the global font, whose lines are taller', () => {
    const fallback = estimateWardPresence(ward('Sione', 'Tupou'), false);
    const global = estimateWardPresence(ward('Sione', 'Tupou'), true);

    expect(global).toBeGreaterThan(fallback);
  });

  // The combination that stranded a ward's heading before the estimate read the data.
  it('asks for most room of all for a wrapping name under the global font', () => {
    const wrapping = ward('Anamarituraaliatangi', 'Fonuaimoanaatuituimatangi');

    expect(estimateWardPresence(wrapping, true)).toBeGreaterThan(
      estimateWardPresence(wrapping, false),
    );
    expect(estimateWardPresence(wrapping, true)).toBeGreaterThan(
      estimateWardPresence(ward('Sione', 'Tupou'), true),
    );
  });

  it('still asks for a heading, headers and two rows when a ward has no patients', () => {
    expect(estimateWardPresence({ patients: [] }, false)).toBeGreaterThan(0);
    expect(estimateWardPresence(undefined, false)).toBeGreaterThan(0);
  });

  it('counts a missing name as one line rather than none', () => {
    const named = estimateWardPresence(ward('Sione', 'Tupou'), false);

    expect(estimateWardPresence(ward(undefined, undefined), false)).toBe(named);
  });
});
