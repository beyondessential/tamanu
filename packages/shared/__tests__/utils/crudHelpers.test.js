import { describe, expect, it } from 'vitest';
import { InvalidOperationError, UsageError } from '@tamanu/errors';

import { simplePatch, simplePost, simplePut } from '../../src/utils/crudHelpers';

// These guards are what stops a new call site from reintroducing mass assignment. Whether a
// field is protected is known while the route is being built, so that half throws at boot;
// whether it exists needs the model, so that half throws on the first request.

const fakeModel = {
  name: 'Fake',
  findByPk: async () => null,
  create: async values => values,
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

const ALL_HELPERS = [
  ['simplePut', simplePut],
  ['simplePost', simplePost],
  ['simplePatch', simplePatch],
];

describe('crudHelpers allowedFields', () => {
  describe.each(ALL_HELPERS)('%s', (name, helper) => {
    it('refuses to build a route with no allowedFields', () => {
      expect(() => helper('Fake')).toThrow(InvalidOperationError);
      expect(() => helper('Fake')).toThrow(`${name} requires a nonempty allowedFields option`);
    });

    it('refuses to build a route with an empty allowedFields', () => {
      expect(() => helper('Fake', { allowedFields: [] })).toThrow(InvalidOperationError);
    });

    it.each(['createdAt', 'updatedAt', 'deletedAt', 'updatedAtSyncTick'])(
      'refuses to build a route allowing %s',
      field => {
        expect(() => helper('Fake', { allowedFields: [field] })).toThrow(UsageError);
      },
    );

    it('rejects a field the model does not have', async () => {
      const handler = helper('Fake', { allowedFields: ['nonexistentField'] });
      await expect(invoke(handler)).rejects.toThrow(UsageError);
    });

    it('does not blow up naming a model that is not registered', async () => {
      const handler = helper('Missing', { allowedFields: ['name'] });
      await expect(invoke(handler, { models: {} })).rejects.toThrow(UsageError);
    });
  });

  // An update addresses its record by URL, so it must not be able to name the primary key.
  // A create can, because the client may supply the id of the record it is making.
  describe.each([
    ['simplePut', simplePut],
    ['simplePatch', simplePatch],
  ])('%s', (_name, helper) => {
    it('refuses to build a route allowing id', () => {
      expect(() => helper('Fake', { allowedFields: ['id'] })).toThrow(UsageError);
    });
  });

  describe('simplePost', () => {
    it('accepts id as an allowed field', async () => {
      const handler = simplePost('Fake', { allowedFields: ['id'] });
      await expect(invoke(handler, { body: { id: 'supplied-id' } })).resolves.toEqual({
        id: 'supplied-id',
      });
    });
  });
});
