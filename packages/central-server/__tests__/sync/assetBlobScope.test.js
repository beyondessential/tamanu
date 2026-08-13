import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { fake } from '@tamanu/fake-data/fake';
import { fakeUUID } from '@tamanu/utils/generateId';
import { settingsCache } from '@tamanu/settings';

import { ApplicationContext } from '../../app/ApplicationContext';
import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { isHashReferencedInScope } from '../../app/blobReferences';
import { createTestContext } from '../utilities';

// spec: ASSET, BLAC
// A facility fetches an asset's bytes by hash, and central authorises that fetch
// against the referencing asset row. Assets only reach the reference layer
// because the application context registers them there at boot; the module's
// static list holds attachments alone. Nothing else exercises that registration,
// so without this the whole asset arm can be removed and the suite stays green,
// while every facility silently stops receiving letterhead and logo bytes.
describe('Asset blob scope', () => {
  let ctx;
  let models;
  let sequelize;
  let appContext;
  let root;
  let facility;
  let otherFacility;

  const assetCarryingHash = async (name, overrides = {}) => {
    const hash = `sha256:${fakeUUID().replace(/-/g, '')}`;
    await models.Asset.create(
      fake(models.Asset, { name, data: null, hash, facilityId: null, ...overrides }),
    );
    return hash;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    sequelize = ctx.store.sequelize;

    root = await fs.mkdtemp(path.join(os.tmpdir(), 'asset-blob-scope-'));
    await models.Setting.set('blobStorage.root', root);
    settingsCache.reset();

    facility = await models.Facility.create(fake(models.Facility));
    otherFacility = await models.Facility.create(fake(models.Facility));

    appContext = await new ApplicationContext().init();
  });

  afterAll(async () => {
    await models.Setting.destroy({ where: { key: 'blobStorage.root' }, force: true });
    settingsCache.reset();
    await appContext.close();
    await fs.rm(root, { recursive: true, force: true });
    await ctx.close();
  });

  const inScope = async (hash, facilityIds) =>
    await isHashReferencedInScope(sequelize, { hash, facilityIds });

  it('authorises a deployment-wide asset for any facility', async () => {
    const hash = await assetCarryingHash('letterhead');
    await new CentralSyncManager(ctx).updateLookupTable();

    expect(await inScope(hash, [facility.id])).toBe(true);
    expect(await inScope(hash, [otherFacility.id])).toBe(true);
  });

  // A facility-specific asset is preferred over the deployment-wide one by the
  // renderer, which is a different question from who may fetch its bytes: assets
  // sync to every facility, so every facility server is entitled to any of them.
  it('authorises a facility-specific asset for a facility it does not belong to', async () => {
    const hash = await assetCarryingHash('facility letterhead', { facilityId: facility.id });
    await new CentralSyncManager(ctx).updateLookupTable();

    expect(await inScope(hash, [facility.id])).toBe(true);
    expect(await inScope(hash, [otherFacility.id])).toBe(true);
  });

  // Without this the two cases above would pass against a predicate that
  // admitted everything, which is what an over-broad registration looks like.
  it('refuses a hash no asset references', async () => {
    expect(await inScope(`sha256:${fakeUUID().replace(/-/g, '')}`, [facility.id])).toBe(false);
  });
});
