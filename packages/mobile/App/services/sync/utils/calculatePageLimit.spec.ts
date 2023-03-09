import { calculatePageLimit, OPTIMAL_TIME_PER_PAGE } from './calculatePageLimit';

describe('calculatePageLimit', () => {
  it("doesn't get stuck at 1 record", () => {
    const oldLimit = 1;
    const time = OPTIMAL_TIME_PER_PAGE / 2;
    const newLimit = calculatePageLimit(oldLimit, time);
    expect(newLimit).toBe(2);
  });
});
