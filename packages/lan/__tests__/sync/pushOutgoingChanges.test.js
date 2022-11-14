import * as fc from 'fast-check';
import { expect, describe, it } from '@jest/globals';

import { withErrorShown } from 'shared/test-helpers';

import { pushOutgoingChanges } from '../../app/sync/pushOutgoingChanges';

const makeLimitConfig = config => ({ sync: { dynamicLimiter: config } });
const limitConfig = fc.record({
  initialLimit: fc.integer({ min: 1, max: 1000 }),
  minLimit: fc.integer({ min: 1, max: 999 }),
  maxLimit: fc.integer({ min: 1000, max: 100000 }),
  optimalTimePerPageMs: fc.integer({ min: 50, max: 10000 }),
  maxLimitChangePerPage: fc.double({ min: 0.1, max: 0.9 }),
});

describe('pushOutgoingChanges', () => {
  it(
    'calls centralServer.push at least once',
    withErrorShown(async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constant('change'), { minLength: 1 }),
          limitConfig,
          async (changes, config) => {
            const centralServer = { push: jest.fn().mockImplementation(async () => {}) };
            await pushOutgoingChanges(centralServer, 'sessionId', changes, makeLimitConfig(config));
            expect(centralServer.push).toHaveBeenCalled();
          },
        ),
      );
    }),
  );

  it(
    'calls centralServer.push at least twice if changes.length > initial limit',
    withErrorShown(async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .tuple(fc.array(fc.constant('change'), { minLength: 1 }), limitConfig)
            .filter(([changes, config]) => changes.length > config.initialLimit),
          async ([changes, config]) => {
            const centralServer = { push: jest.fn().mockImplementation(async () => {}) };
            await pushOutgoingChanges(centralServer, 'sessionId', changes, makeLimitConfig(config));
            expect(centralServer.push.mock.calls.length).toBeGreaterThanOrEqual(2);
          },
        ),
      );
    }),
  );

  it(
    'pushes all of the changes',
    withErrorShown(async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constant('change'), { minLength: 1 }),
          limitConfig,
          async (changes, config) => {
            const centralServer = { push: jest.fn().mockImplementation(async () => {}) };
            await pushOutgoingChanges(centralServer, 'sessionId', changes, makeLimitConfig(config));
            expect(
              centralServer.push.mock.calls.flatMap(([_sessionId, page]) => page).length,
            ).toEqual(changes.length);
          },
        ),
      );
    }),
  );
});
