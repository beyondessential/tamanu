import { Readable } from 'node:stream';

import config from 'config';

import { ASSET_NAMES, BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

const NAME = ASSET_NAMES.LETTERHEAD_LOGO;
const LEGACY_NAME = ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG;
const PENDING_NAME = ASSET_NAMES.DEATH_CERTIFICATE_BOTTOM_HALF_IMG;
const UNUPLOADED_NAME = ASSET_NAMES.VACCINE_CERTIFICATE_WATERMARK;
const IMAGE = Buffer.from('facility-asset-image-bytes');

describe('Asset GET endpoint', () => {
  let ctx;
  let models;
  let app;
  // The web client always scopes the asset lookup to its facility (useAuth), so
  // the request carries the facility id the same way here.
  const [facilityId] = selectFacilityIds(config);

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    app = await ctx.baseApp.asRole('practitioner');
  });

  afterAll(async () => ctx.close());

  it('resolves a hash-form row through the blob cache, returning bytes inline', async () => {
    const { hash } = await ctx.blobStore.put(Readable.from([IMAGE]), { sizeHint: IMAGE.length });
    await models.Asset.create({ name: NAME, type: 'image/png', hash, data: null });

    const response = await app.get(`/api/asset/${NAME}`).query({ facilityId });
    expect(response).toHaveSucceeded();
    expect(Buffer.from(response.body.data)).toEqual(IMAGE);
    expect(response.body.availability).toBeUndefined();
  });

  it('returns a legacy in-database row unchanged', async () => {
    await models.Asset.create({ name: LEGACY_NAME, type: 'image/png', data: IMAGE, hash: null });

    const response = await app.get(`/api/asset/${LEGACY_NAME}`).query({ facilityId });
    expect(response).toHaveSucceeded();
    expect(Buffer.from(response.body.data)).toEqual(IMAGE);
  });

  it('reports content-pending for a hash row whose bytes are not held', async () => {
    // A hash the store has never been given, so resolution misses locally and,
    // with no central to fetch from in this harness, cannot be filled.
    await models.Asset.create({
      name: PENDING_NAME,
      type: 'image/png',
      hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      data: null,
    });

    const response = await app.get(`/api/asset/${PENDING_NAME}`).query({ facilityId });
    expect(response).toHaveSucceeded();
    expect(response.body.data).toBeNull();
    expect(response.body.availability).toBe(BLOB_AVAILABILITY_STATES.AWAITING_FETCH);
  });

  it('returns an empty object when no asset row exists', async () => {
    const response = await app.get(`/api/asset/${UNUPLOADED_NAME}`).query({ facilityId });
    expect(response).toHaveSucceeded();
    expect(response.body).toEqual({});
  });

  it('rejects an unauthenticated request', async () => {
    const response = await ctx.baseApp.get(`/api/asset/${NAME}`).query({ facilityId });
    expect(response).not.toHaveSucceeded();
  });
});
