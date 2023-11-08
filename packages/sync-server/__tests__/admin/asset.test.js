import { ASSET_NAMES } from '@tamanu/constants/importable';
import { createTestContext } from '../utilities';

// doesn't really matter which name it is as long is it's consistent
const [NAME, OTHER_NAME] = Object.values(ASSET_NAMES);

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
    const response = await baseApp.put(`/v1/admin/asset/${NAME}`).send({
      name: NAME,
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).toBeForbidden();
  });

  it('should upload a new asset', async () => {
    const response = await adminApp.put(`/v1/admin/asset/${NAME}`).send({
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('action', 'created');

    const asset = await models.Asset.findOne({ where: { name: NAME }});
    expect(asset).toBeTruthy();
    expect(asset).toMatchObject({ name: NAME, type: 'image/png' });
    expect(response.body).toHaveProperty('id', asset.id);

    const rawData = Buffer.from(B64_PNG_1X1_CLEAR, 'base64');
    expect(rawData).toEqual(asset.data);
  });

  it('should update an existing asset', async () => {
    const response = await adminApp.put(`/v1/admin/asset/${OTHER_NAME}`).send({
      name: OTHER_NAME,
      filename: 'test.png',
      data: B64_PNG_1X1_WHITE,
    });
    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('action', 'created');

    const response2 = await adminApp.put(`/v1/admin/asset/${OTHER_NAME}`).send({
      name: OTHER_NAME,
      filename: 'test.png',
      data: B64_PNG_1X1_BLACK,
    });
    expect(response2).toHaveSucceeded();
    expect(response2.body).toHaveProperty('action', 'updated');

    const asset = await models.Asset.findOne({ where: { name: OTHER_NAME }});
    expect(response2.body).toHaveProperty('id', asset.id);
    const rawData = Buffer.from(B64_PNG_1X1_BLACK, 'base64');
    expect(rawData).toEqual(asset.data);
  });

  it('should reject an asset with an invalid name', async () => {
    const response = await adminApp.put('/v1/admin/asset/madeupname').send({
      filename: 'test.png',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).not.toHaveSucceeded();
    expect(response.body.error.message).toMatch('one of the following values');
  });

  it('should detect .svg as image/svg', async () => {
    const response = await adminApp.put(`/v1/admin/asset/${NAME}`).send({
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
    const response = await adminApp.put(`/v1/admin/asset/${NAME}`).send({
      filename: 'test.xyz',
      data: B64_PNG_1X1_CLEAR,
    });
    expect(response).not.toHaveSucceeded();
    expect(response.body.error.message).toMatch('one of the following values');
  });

  it('should reject an asset without data', async () => {
    const response = await adminApp.put(`/v1/admin/asset/${NAME}`).send({
      filename: 'test.png',
      data: '',
    });
    expect(response).not.toHaveSucceeded();
    expect(response.body.error.message).toMatch('data is a required field');
  });
});
