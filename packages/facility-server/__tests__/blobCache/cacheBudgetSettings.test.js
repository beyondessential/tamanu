import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import config from 'config';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';
import { ApplicationContext } from '../../app/ApplicationContext';

const uniqueContent = () => Buffer.from(`blob content ${randomUUID()}`);

// The cache budget is only ever read through the application context, so this
// suite boots one rather than injecting a budget the way the rest do.
describe('cache size budget from facility settings', () => {
  let ctx;
  let models;
  let appContext;
  let root;
  let facilityId;

  const setBudgetGB = async budgetGB => {
    await models.Setting.set(
      'blobStorage.cacheSizeBudgetGB',
      budgetGB,
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );
    settingsCache.reset();
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    [facilityId] = selectFacilityIds(config);

    root = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-budget-settings-'));
    await models.Setting.set('blobStorage.root', root, SETTINGS_SCOPES.FACILITY, facilityId);
    settingsCache.reset();

    appContext = await new ApplicationContext().init();
  });

  afterAll(async () => {
    await models.Setting.destroy({ where: { key: 'blobStorage.root' }, force: true });
    await models.Setting.destroy({ where: { key: 'blobStorage.cacheSizeBudgetGB' }, force: true });
    settingsCache.reset();
    await fs.rm(root, { recursive: true, force: true });
    await ctx.close();
  });

  beforeEach(async () => {
    await models.Blob.destroy({ where: {}, force: true });
  });

  const putCache = async () => {
    const content = uniqueContent();
    const { hash } = await appContext.blobStore.put(Readable.from(content));
    return { hash, content };
  };

  const setLastAccessed = async (hash, msAgo) =>
    models.Blob.update(
      { lastAccessedAt: new Date(Date.now() - msAgo) },
      { where: { hash }, silent: true },
    );

  it('evicts once the cache exceeds the configured budget', async () => {
    // verifies spec: CACHE — the budget is an administrator setting scoped to
    // the facility
    const stale = await putCache();
    const recent = await putCache();
    await setLastAccessed(stale.hash, 2 * 60 * 60 * 1000);
    // a budget in bytes just under what the two blobs occupy, expressed in GB
    await setBudgetGB((stale.content.length + recent.content.length - 1) / 1024 ** 3);

    await appContext.blobCache.enforceBudget();

    expect(await appContext.blobStore.has(stale.hash)).toBe(false);
    expect(await appContext.blobStore.has(recent.hash)).toBe(true);
  });

  it('reads the setting as gigabytes rather than bytes', async () => {
    // verifies spec: CACHE — a budget of a fraction of a gigabyte still leaves
    // room for content a byte-denominated reading of the same number would evict
    const stale = await putCache();
    const recent = await putCache();
    await setLastAccessed(stale.hash, 2 * 60 * 60 * 1000);
    await setBudgetGB((stale.content.length + recent.content.length) / 1024 ** 3);

    await appContext.blobCache.enforceBudget();

    expect(await appContext.blobStore.has(stale.hash)).toBe(true);
    expect(await appContext.blobStore.has(recent.hash)).toBe(true);
  });
});
