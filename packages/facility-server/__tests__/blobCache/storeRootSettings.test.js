import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import config from 'config';

import { FACT_FACILITY_IDS, SETTINGS_SCOPES } from '@tamanu/constants';
import { facilityDefaults, settingsCache } from '@tamanu/settings';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';
import { ApplicationContext } from '../../app/ApplicationContext';
import { initServerConfig } from '../../app/serverConfig';

// The store root is only ever read through the application context, so this
// suite boots one rather than injecting a root the way the rest do.
describe('blob store root from facility settings', () => {
  let ctx;
  let models;
  let root;
  let facilityId;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    [facilityId] = selectFacilityIds(config);

    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-store-root-'));
    await models.Setting.set('blobStorage.root', root, SETTINGS_SCOPES.FACILITY, facilityId);
    settingsCache.reset();
  });

  afterAll(async () => {
    await models.Setting.destroy({ where: { key: 'blobStorage.root' }, force: true });
    settingsCache.reset();
    await fs.rm(root, { recursive: true, force: true });
    await ctx.close();
  });

  it('sites the store at the configured root', async () => {
    // verifies spec: CAP — the root is configurable so the store can sit on a
    // volume of its own
    const appContext = await new ApplicationContext().init();
    expect(appContext.blobStore.root).toBe(root);

    const content = Buffer.from(`blob content ${randomUUID()}`);
    await appContext.blobStore.put(Readable.from([content]));

    const entries = await fs.readdir(root, { recursive: true, withFileTypes: true });
    const stored = await Promise.all(
      entries
        .filter(entry => entry.isFile())
        .map(entry => fs.readFile(path.join(entry.parentPath, entry.name))),
    );
    expect(stored).toContainEqual(content);
  });

  it('falls back to the schema default when no facility has synced', async () => {
    // verifies spec: CAP — the root is facility-scoped, so a server with no
    // facility yet has no reader to ask for it
    const syncedFacilityIds = await models.LocalSystemFact.get(FACT_FACILITY_IDS);
    await models.LocalSystemFact.set(FACT_FACILITY_IDS, '[]');
    try {
      const appContext = await new ApplicationContext().init();
      expect(appContext.blobStore.root).toBe(facilityDefaults.blobStorage.root);
    } finally {
      await models.LocalSystemFact.set(FACT_FACILITY_IDS, syncedFacilityIds);
      await initServerConfig({ context: ctx });
    }
  });
});
