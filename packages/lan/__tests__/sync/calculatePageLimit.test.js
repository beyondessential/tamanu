import * as fc from 'fast-check';

import { calculatePageLimit } from '../../app/sync/calculatePageLimit';

const defaultConfig = {
  initialLimit: 10,
  minLimit: 1,
  maxLimit: 10000,
  optimalTimePerPageMs: 2000,
  maxLimitChangePerPage: 0.2,
};

const makeConfig = overrides => ({ ...defaultConfig, ...overrides });

describe('calculatePageLimit', () => {
  it('accepts two numeric inputs and returns a number', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        expect(calculatePageLimit(a, b)).toEqual(expect.any(Number));
      }),
      fc.property(fc.float(), fc.float(), (a, b) => {
        expect(calculatePageLimit(a, b)).toEqual(expect.any(Number));
      }),
      fc.property(fc.double({ noNaN: true }), fc.double({ noNaN: true }), (a, b) => {
        expect(calculatePageLimit(a, b)).toEqual(expect.any(Number));
      }),
    );
  });

  it('with currentLimit = 0, outputs the initial limit', () => {
    fc.assert(
      fc.property(fc.nat(), fc.integer(), (initialLimit, time) => {
        expect(calculatePageLimit(0, time, makeConfig({ initialLimit }))).toEqual(initialLimit);
      }),
    );
  });

  it('never grows below the minimum limit', () => {
    fc.assert(
      fc.property(fc.nat(), fc.integer(), (minLimit, time) => {
        expect(
          calculatePageLimit(minLimit, time, makeConfig({ minLimit, maxLimit: minLimit + 1 })),
        ).toBeGreaterThanOrEqual(minLimit);
      }),
    );
  });

  it('never grows above the maximum limit', () => {
    fc.assert(
      fc.property(fc.integer({ min: 20, max: 10000 }), fc.integer(), (maxLimit, time) => {
        expect(
          calculatePageLimit(maxLimit, time, makeConfig({ maxLimit, minLimit: maxLimit - 1 })),
        ).toBeLessThanOrEqual(maxLimit);
      }),
    );
  });

  it('treats negative times as invalid and returns the input', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), fc.integer({ max: -1 }), (limit, time) => {
        expect(calculatePageLimit(limit, time)).toEqual(limit);
      }),
    );
  });
});
