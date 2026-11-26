import { describe, expect, it, vi } from 'vitest';
import { InvalidOperationError, UsageError } from '@tamanu/errors';

import { getResourceList, simplePatch, simplePost, simplePut } from '../../src/utils/crudHelpers';

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

describe('getResourceList', () => {
  const listQueries = [];
  const listedModel = {
    getListReferenceAssociations: () => ['Reference'],
    count: async () => 0,
    findAll: async queryOptions => {
      listQueries.push(queryOptions);
      return [];
    },
  };
  const listWith = (query, options) =>
    getResourceList(
      {
        models: { Listed: listedModel },
        params: { id: 'parent-id' },
        query,
        checkPermission: () => {},
      },
      'Listed',
      'parentId',
      options,
    );
  const lastOrder = () => listQueries.at(-1).order;

  it('orders by createdAt when no sort is requested', async () => {
    await listWith({});
    expect(lastOrder()).toEqual([['createdAt', 'ASC']]);
  });

  it('orders by the requested column, including one on an association', async () => {
    await listWith({ orderBy: 'Reference.name', order: 'desc' });
    expect(lastOrder()).toEqual([['Reference', 'name', 'DESC']]);
  });

  it('orders by what buildOrder returns, given the sort as requested', async () => {
    const builtOrder = [['custom', 'ASC']];
    const buildOrder = vi.fn(() => builtOrder);

    await listWith({}, { buildOrder });
    expect(buildOrder).toHaveBeenLastCalledWith({ orderBy: undefined, order: 'ASC' });
    expect(lastOrder()).toBe(builtOrder);

    await listWith({ orderBy: 'name', order: 'desc' }, { buildOrder });
    expect(buildOrder).toHaveBeenLastCalledWith({ orderBy: 'name', order: 'desc' });
  });
});
