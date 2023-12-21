import * as fc from 'fast-check';
import { expect, describe, it } from '@jest/globals';

import { withErrorShown } from '@tamanu/shared/test-helpers';

const makeLimitConfig = config => ({ sync: { dynamicLimiter: config } });
const limitConfig = fc.record({
  initialLimit: fc.integer({ min: 1, max: 1000 }),
  minLimit: fc.integer({ min: 1, max: 999 }),
  maxLimit: fc.integer({ min: 1000, max: 100000 }),
  optimalTimePerPageMs: fc.integer({ min: 50, max: 10000 }),
  maxLimitChangePerPage: fc.double({ min: 0.1, max: 0.9, noNaN: true }),
});

describe('pushOutgoingChanges', () => {
  it(
    'calls centralServer.push at least once',
    withErrorShown(async () => {
      await fc.assert(
        fc
          .asyncProperty(
            fc.array(fc.constant('change'), { minLength: 1 }),
            limitConfig,
            async (changes, config) => {
              jest.doMock('config', () => makeLimitConfig(config));
              // Have to load test function within test scope so that we can mock config per test case
              // https://jestjs.io/docs/jest-object#jestdomockmodulename-factory-options
              const { pushOutgoingChanges } = require('../../app/sync/pushOutgoingChanges');
              const centralServer = {
                push: jest.fn().mockImplementation(async () => {}),
                completePush: jest.fn().mockImplementation(async () => true),
              };
              await pushOutgoingChanges(centralServer, 'sessionId', changes);
              expect(centralServer.push).toHaveBeenCalled();
            },
          )
          .beforeEach(() => {
            jest.resetModules();
          }),
      );
    }),
  );

  it(
    'calls centralServer.push at least twice if changes.length > initial limit',
    withErrorShown(async () => {
      await fc.assert(
        fc
          .asyncProperty(
            fc
              .tuple(fc.array(fc.constant('change'), { minLength: 1 }), limitConfig)
              .filter(([changes, config]) => changes.length > config.initialLimit),
            async ([changes, config]) => {
              jest.doMock('config', () => makeLimitConfig(config));
              // Have to load test function within test scope so that we can mock config per test case
              // https://jestjs.io/docs/jest-object#jestdomockmodulename-factory-options
              const { pushOutgoingChanges } = require('../../app/sync/pushOutgoingChanges');
              const centralServer = {
                push: jest.fn().mockImplementation(async () => {}),
                completePush: jest.fn().mockImplementation(async () => true),
              };
              await pushOutgoingChanges(centralServer, 'sessionId', changes);
              expect(centralServer.push.mock.calls.length).toBeGreaterThanOrEqual(2);
            },
          )
          .beforeEach(() => {
            jest.resetModules();
          }),
      );
    }),
  );

  it(
    'pushes all of the changes',
    withErrorShown(async () => {
      await fc.assert(
        fc
          .asyncProperty(
            fc.array(fc.constant('change'), { minLength: 1 }),
            limitConfig,
            async (changes, config) => {
              jest.doMock('config', () => makeLimitConfig(config));
              // Have to load test function within test scope so that we can mock config per test case
              // https://jestjs.io/docs/jest-object#jestdomockmodulename-factory-options
              const { pushOutgoingChanges } = require('../../app/sync/pushOutgoingChanges');
              const centralServer = {
                push: jest.fn().mockImplementation(async () => {}),
                completePush: jest.fn().mockImplementation(async () => true),
              };
              await pushOutgoingChanges(centralServer, 'sessionId', changes);
              expect(
                centralServer.push.mock.calls.flatMap(([_sessionId, page]) => page).length,
              ).toEqual(changes.length);
            },
          )
          .beforeEach(() => {
            jest.resetModules();
          }),
      );
    }),
  );
});
