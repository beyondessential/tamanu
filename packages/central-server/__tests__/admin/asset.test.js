import { ASSET_NAMES } from '@tamanu/constants/importable';
import { createTestContext } from '../utilities';

// doesn't really matter which name it is as long is it's consistent, but each
// test that asserts a create must own a name no other test has touched
const [NAME, OTHER_NAME, THIRD_NAME, FORBID_NAME] = Object.values(ASSET_NAMES);
// The dedup case needs two names no other test touches, named explicitly so a
// reorder of ASSET_NAMES can't silently change which assets it uploads.
const DEDUP_NAME_A = ASSET_NAMES.COVID_VACCINATION_CERTIFICATE_FOOTER;
const DEDUP_NAME_B = ASSET_NAMES.COVID_CLEARANCE_CERTIFICATE_FOOTER;
// Must stay unuploaded so the create branch is the one under test.
const UNCREATED_NAME = ASSET_NAMES.COVID_TEST_CERTIFICATE_FOOTER;

const streamToBuffer = async stream => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const B64_PNG_1X1_CLEAR = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
const B64_PNG_1X1_BLACK = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAANQTFRFAAAAp3o92gAAAApJREFUeJxjYAAAAAIAAUivpHEAAAAASUVORK5CYII=';
const B64_PNG_1X1_WHITE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAANQTFRF////p8QbyAAAAApJREFUeJxjYAAAAAIAAUivpHEAAAAASUVORK5CYII=';

describe('Asset upload', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('should forbid uploading without permission', async () => {
    const response = await baseApp.put(`/api/admin/asset/${NAME}`).send({
      name: NAME,
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).not.toHaveSucceeded();
  });

  it('should forbid a user without write permission from replacing an existing asset', async () => {
    // Seed a dedicated asset so the PUT takes the update (write) branch, not
    // create, without colliding with the create-asserting tests below.
    await adminApp.put(`/api/admin/asset/${FORBID_NAME}`).send({
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });

    const noWriteApp = await baseApp.asNewRole([['read', 'Asset']]);
    const response = await noWriteApp.put(`/api/admin/asset/${FORBID_NAME}`).send({
      filename: 'test.png',
      data: B64_PNG_1X1_WHITE,
    });
    expect(response).toBeForbidden();
  });

  it('should forbid a user without create permission from uploading a new asset', async () => {
    // The unauthenticated case above is rejected by auth middleware and never
    // reaches checkPermission; this authenticated-but-unprivileged user does.
    const noCreateApp = await baseApp.asNewRole([['read', 'Asset']]);
    const response = await noCreateApp.put(`/api/admin/asset/${UNCREATED_NAME}`).send({
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).toBeForbidden();

    // The blob must not be admitted when the permission check refuses.
    const asset = await models.Asset.findOne({ where: { name: UNCREATED_NAME } });
    expect(asset).toBeNull();
  });

  it('should upload a new asset, storing the bytes as a blob and recording the hash', async () => {
    const response = await adminApp.put(`/api/admin/asset/${NAME}`).send({
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('action', 'created');

    const asset = await models.Asset.findOne({ where: { name: NAME }});
    expect(asset).toBeTruthy();
    expect(asset).toMatchObject({ name: NAME, type: 'image/png' });
    expect(response.body).toHaveProperty('id', asset.id);

    // spec: ASSET — the row records the hash and carries no inline bytes.
    expect(asset.hash).toBeTruthy();
    expect(asset.data).toBeNull();

    // The bytes are retrievable from the blob store by the recorded hash.
    const rawData = Buffer.from(B64_PNG_1X1_CLEAR, 'base64');
    const stored = await streamToBuffer(await ctx.blobStore.get(asset.hash));
    expect(stored).toEqual(rawData);
  });

  it('should update an existing asset, re-pointing the hash at the new bytes', async () => {
    const response = await adminApp.put(`/api/admin/asset/${OTHER_NAME}`).send({
      name: OTHER_NAME,
      filename: 'test.png',
      data: B64_PNG_1X1_WHITE,
    });
    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('action', 'created');
    const created = await models.Asset.findOne({ where: { name: OTHER_NAME }});

    const response2 = await adminApp.put(`/api/admin/asset/${OTHER_NAME}`).send({
      name: OTHER_NAME,
      filename: 'test.png',
      data: B64_PNG_1X1_BLACK,
    });
    expect(response2).toHaveSucceeded();
    expect(response2.body).toHaveProperty('action', 'updated');

    const asset = await models.Asset.findOne({ where: { name: OTHER_NAME }});
    expect(response2.body).toHaveProperty('id', asset.id);
    expect(asset.hash).toBeTruthy();
    expect(asset.hash).not.toEqual(created.hash);
    expect(asset.data).toBeNull();

    const rawData = Buffer.from(B64_PNG_1X1_BLACK, 'base64');
    const stored = await streamToBuffer(await ctx.blobStore.get(asset.hash));
    expect(stored).toEqual(rawData);
  });

  it('should convert a legacy in-database row to hash form on replace', async () => {
    // spec: ASSET — a legacy row carries its bytes inline with no hash; a
    // replace admits the new bytes to the store and drops the inline copy.
    const legacy = await models.Asset.create({
      name: THIRD_NAME,
      type: 'image/png',
      data: Buffer.from(B64_PNG_1X1_WHITE, 'base64'),
    });
    expect(legacy.hash).toBeFalsy();

    const response = await adminApp.put(`/api/admin/asset/${THIRD_NAME}`).send({
      filename: 'test.png',
      data: B64_PNG_1X1_BLACK,
    });
    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('action', 'updated');

    const asset = await models.Asset.findOne({ where: { name: THIRD_NAME }});
    expect(asset.hash).toBeTruthy();
    expect(asset.data).toBeNull();
    const stored = await streamToBuffer(await ctx.blobStore.get(asset.hash));
    expect(stored).toEqual(Buffer.from(B64_PNG_1X1_BLACK, 'base64'));
  });

  it('should store identical bytes once under one hash', async () => {
    const res1 = await adminApp.put(`/api/admin/asset/${DEDUP_NAME_A}`).send({
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });
    const res2 = await adminApp.put(`/api/admin/asset/${DEDUP_NAME_B}`).send({
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(res1).toHaveSucceeded();
    expect(res2).toHaveSucceeded();

    const asset1 = await models.Asset.findOne({ where: { name: DEDUP_NAME_A }});
    const asset2 = await models.Asset.findOne({ where: { name: DEDUP_NAME_B }});
    // spec: CAS — content addressing means the same bytes resolve to one hash.
    expect(asset1.hash).toEqual(asset2.hash);
    const blobCount = await models.Blob.count({ where: { hash: asset1.hash } });
    expect(blobCount).toBe(1);
  });

  it('should reject an asset with an invalid name', async () => {
    const response = await adminApp.put('/api/admin/asset/madeupname').send({
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).not.toHaveSucceeded();
    expect(response.body.error.message).toMatch('one of the following values');
  });

  it('should detect .svg as image/svg', async () => {
    const response = await adminApp.put(`/api/admin/asset/${NAME}`).send({
      filename: 'test.svg',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).toHaveSucceeded();

    const asset = await models.Asset.findOne({ where: { name: NAME }});
    expect(asset).toBeTruthy();
    expect(asset).toMatchObject({ name: NAME, type: 'image/svg' });
    expect(response.body).toHaveProperty('id', asset.id);
  });

  it('should reject an asset with an invalid mime filename', async () => {
    const response = await adminApp.put(`/api/admin/asset/${NAME}`).send({
      filename: 'test.xyz',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).not.toHaveSucceeded();
    expect(response.body.error.message).toMatch('one of the following values');
  });

  it('should reject an asset without data', async () => {
    const response = await adminApp.put(`/api/admin/asset/${NAME}`).send({
      filename: 'test.png',
      data: '',
    });
    expect(response).not.toHaveSucceeded();
    expect(response.body.error.message).toMatch('data is a required field');
  });
});
