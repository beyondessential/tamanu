import { Op } from 'sequelize';

import { ERROR_TYPE } from '@tamanu/errors';

import { buildPrefetchWhere, prefetchAssets } from '../../app/sync/prefetchAssets';

const makeModels = (rows) => ({
  Asset: { findAll: jest.fn(async () => rows.map((hash) => ({ hash }))) },
});

const remoteError = (type) => Object.assign(new Error(`failed: ${type}`), { type });

describe('prefetchAssets', () => {
  let transferChannel;
  let blobCache;

  beforeEach(() => {
    transferChannel = { fetchFromCentral: jest.fn(async () => ({ existed: false })) };
    blobCache = { enforceBudget: jest.fn(async () => {}) };
  });

  it('does nothing without a transfer channel', async () => {
    const models = makeModels(['sha256:a']);
    await prefetchAssets({ models, transferChannel: null, blobCache });
    expect(models.Asset.findAll).not.toHaveBeenCalled();
  });

  it('scopes the query to this server’s facilities and deployment-wide assets', () => {
    const where = buildPrefetchWhere(['facility-a']);
    expect(where.hash).toEqual({ [Op.ne]: null });
    expect(where[Op.or]).toEqual([
      { facilityId: null },
      { facilityId: { [Op.in]: ['facility-a'] } },
    ]);
  });

  it('asks only for deployment-wide assets when the server has no facility yet', () => {
    const where = buildPrefetchWhere([]);
    expect(where.facilityId).toBeNull();
    expect(where[Op.or]).toBeUndefined();
  });

  it('fetches each distinct hash once when assets share content', async () => {
    const models = makeModels(['sha256:a', 'sha256:a', 'sha256:b']);
    await prefetchAssets({ models, transferChannel, blobCache });

    expect(transferChannel.fetchFromCentral).toHaveBeenCalledTimes(2);
    expect(transferChannel.fetchFromCentral.mock.calls.map(([h]) => h)).toEqual([
      'sha256:a',
      'sha256:b',
    ]);
  });

  it('keeps going when central does not hold a blob yet', async () => {
    transferChannel.fetchFromCentral.mockImplementation(async (hash) => {
      if (hash === 'sha256:a') throw remoteError(ERROR_TYPE.NOT_FOUND);
      return { existed: false };
    });
    const models = makeModels(['sha256:a', 'sha256:b']);
    await prefetchAssets({ models, transferChannel, blobCache });

    expect(transferChannel.fetchFromCentral).toHaveBeenCalledTimes(2);
  });

  it('abandons the pass on a transport failure rather than retrying every asset', async () => {
    transferChannel.fetchFromCentral.mockImplementation(async (hash) => {
      if (hash === 'sha256:a') throw remoteError(ERROR_TYPE.REMOTE_UNREACHABLE);
      return { existed: false };
    });
    const models = makeModels(['sha256:a', 'sha256:b', 'sha256:c']);
    await prefetchAssets({ models, transferChannel, blobCache });

    expect(transferChannel.fetchFromCentral).toHaveBeenCalledTimes(1);
  });

  it('enforces the cache budget once after admitting new content', async () => {
    const models = makeModels(['sha256:a', 'sha256:b']);
    await prefetchAssets({ models, transferChannel, blobCache });
    expect(blobCache.enforceBudget).toHaveBeenCalledTimes(1);
  });

  it('skips budget enforcement when everything was already held', async () => {
    transferChannel.fetchFromCentral.mockResolvedValue({ existed: true });
    const models = makeModels(['sha256:a']);
    await prefetchAssets({ models, transferChannel, blobCache });
    expect(blobCache.enforceBudget).not.toHaveBeenCalled();
  });

  it('never fails the sync when budget enforcement throws', async () => {
    blobCache.enforceBudget.mockRejectedValue(new Error('disk gone'));
    const models = makeModels(['sha256:a']);
    await expect(prefetchAssets({ models, transferChannel, blobCache })).resolves.toBeUndefined();
  });
});
