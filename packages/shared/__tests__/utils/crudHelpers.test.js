import { describe, expect, it } from 'vitest';
import { InvalidOperationError, UsageError } from '@tamanu/errors';

import { simplePatch, simplePost, simplePut } from '../../src/utils/crudHelpers';

// These guards are what stops a new call site from reintroducing mass assignment: the
// nonempty-allowedFields check throws while routes are being registered, and the field
// check throws the first time the route is hit outside production.

const fakeModel = {
  name: 'Fake',
  rawAttributes: {
    id: {},
    name: {},
    createdAt: {},
    updatedAt: {},
    deletedAt: {},
    updatedAtSyncTick: {},
  },
};

// asyncHandler passes a rejection to next(), so surface it as a rejected promise.
const invoke = (handler, req = {}) =>
  new Promise((resolve, reject) => {
    const baseReq = {
      params: {},
      body: {},
      models: { Fake: fakeModel },
      checkPermission: () => {},
    };
    handler({ ...baseReq, ...req }, { send: resolve }, reject);
  });

describe('crudHelpers allowedFields', () => {
  describe.each([
    ['simplePut', simplePut],
    ['simplePost', simplePost],
    ['simplePatch', simplePatch],
  ])('%s', (name, helper) => {
    it('refuses to build a route with no allowedFields', () => {
      expect(() => helper('Fake')).toThrow(InvalidOperationError);
      expect(() => helper('Fake')).toThrow(`${name} requires a nonempty allowedFields option`);
    });

    it('refuses to build a route with an empty allowedFields', () => {
      expect(() => helper('Fake', { allowedFields: [] })).toThrow(InvalidOperationError);
    });

    it.each(['createdAt', 'updatedAt', 'deletedAt', 'updatedAtSyncTick'])(
      'rejects %s as an allowed field',
      async field => {
        const handler = helper('Fake', { allowedFields: [field] });
        await expect(invoke(handler)).rejects.toThrow(UsageError);
      },
    );

    it('rejects a field the model does not have', async () => {
      const handler = helper('Fake', { allowedFields: ['nonexistentField'] });
      await expect(invoke(handler)).rejects.toThrow(UsageError);
    });
  });
});
