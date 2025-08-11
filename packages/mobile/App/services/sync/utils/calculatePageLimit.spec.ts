import { calculatePageLimit, DYNAMIC_LIMITER_DEFAULTS } from './calculatePageLimit';

describe('calculatePageLimit', () => {
  it("doesn't get stuck at 1 record", () => {
    const oldLimit = 1;
    const { optimalTimePerPage } = DYNAMIC_LIMITER_DEFAULTS;
    const time = optimalTimePerPage / 2;
    const newLimit = calculatePageLimit(undefined, oldLimit, time);
    expect(newLimit).toBe(2);
  });
});
