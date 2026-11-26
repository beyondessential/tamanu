import { describe, expect, it } from 'vitest';

import { estimateWardPresence } from '../../src/utils/dietSummary/estimateWardPresence';

const ward = label => ({ patients: [{ label }] });

const SHORT_LABEL = 'Sione Tupou (42 years)';
const WRAPPING_LABEL = 'Anamarituraaliatangi Fonuaimoanaatuituimatangi (42 years)';

describe('estimateWardPresence', () => {
  it('asks for more room when the first patient’s name and age wrap than when they do not', () => {
    const short = estimateWardPresence(ward(SHORT_LABEL), false);
    const long = estimateWardPresence(ward(WRAPPING_LABEL), false);

    expect(long).toBeGreaterThan(short);
  });

  it('asks for more room under the global font, whose lines are taller', () => {
    const fallback = estimateWardPresence(ward(SHORT_LABEL), false);
    const global = estimateWardPresence(ward(SHORT_LABEL), true);

    expect(global).toBeGreaterThan(fallback);
  });

  // The combination that stranded a ward's heading before the estimate read the data.
  it('asks for most room of all for a wrapping name under the global font', () => {
    const wrapping = ward(WRAPPING_LABEL);

    expect(estimateWardPresence(wrapping, true)).toBeGreaterThan(
      estimateWardPresence(wrapping, false),
    );
    expect(estimateWardPresence(wrapping, true)).toBeGreaterThan(
      estimateWardPresence(ward(SHORT_LABEL), true),
    );
  });

  it('still asks for a heading, headers and two rows when a ward has no patients', () => {
    expect(estimateWardPresence({ patients: [] }, false)).toBeGreaterThan(0);
    expect(estimateWardPresence(undefined, false)).toBeGreaterThan(0);
  });

  it('counts a missing name as one line rather than none', () => {
    const named = estimateWardPresence(ward(SHORT_LABEL), false);

    expect(estimateWardPresence(ward(undefined), false)).toBe(named);
  });
});
