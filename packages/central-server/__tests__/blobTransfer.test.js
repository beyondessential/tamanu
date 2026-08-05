import { createHash } from 'node:crypto';

import { fake } from '@tamanu/fake-data/fake';
import { BLOB_AVAILABILITY_STATES, BLOB_OFFER_STATUSES, DEVICE_SCOPES } from '@tamanu/constants';

import { createTestContext } from './utilities';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

const HELLO = Buffer.from('hello world');
const HELLO_HASH = hashOf(HELLO);
const EMPTY_HASH = hashOf(Buffer.alloc(0));

describe('Blob transfer channel', () => {
  let ctx;
  let baseApp;
  let models;

  const asSyncDevice = async deviceId => {
    const user = await models.User.create(fake(models.User, { password: 'password' }));
    await models.Device.create(
      fake(models.Device, {
        id: deviceId,
        registeredById: user.id,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      }),
    );
    const login = await baseApp.post('/api/login').send({
      email: user.email,
      password: 'password',
      deviceId,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });
    expect(login).toHaveSucceeded();
    return { token: login.body.token };
  };

  const authed = (request, token) => request.set('authorization', `Bearer ${token}`);

  let token;

  const offer = (hash, size) =>
    authed(baseApp.post(`/api/blob/${encodeURIComponent(hash)}/offer`), token).send({ size });

  const putChunk = (hash, chunk, offset, totalSize) =>
    authed(baseApp.put(`/api/blob/${encodeURIComponent(hash)}/content`), token)
      .query({ offset, totalSize })
      .set('content-type', 'application/octet-stream')
      .send(chunk);

  const pushWhole = async (hash, content) => {
    const offered = await offer(hash, content.length);
    expect(offered).toHaveSucceeded();
    const put = await putChunk(hash, content, 0, content.length);
    expect(put).toHaveSucceeded();
    expect(put.body.acknowledged).toBe(true);
    return put;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    ({ token } = await asSyncDevice('blob-transfer-test-device'));
  });

  afterAll(() => ctx.close());

  describe('authorisation', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await baseApp.get(
        `/api/blob/${encodeURIComponent(HELLO_HASH)}/availability`,
      );
      expect(response).toHaveRequestError();
    });

    it('rejects an authenticated user whose device lacks the sync-client scope', async () => {
      const user = await models.User.create(fake(models.User, { password: 'password' }));
      const login = await baseApp.post('/api/login').send({
        email: user.email,
        password: 'password',
        deviceId: 'blob-transfer-unscoped-device',
        scopes: [],
      });
      expect(login).toHaveSucceeded();

      const response = await authed(
        baseApp.get(`/api/blob/${encodeURIComponent(HELLO_HASH)}/availability`),
        login.body.token,
      );
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('availability', () => {
    it('reports a hash it does not hold as awaiting upload', async () => {
      const hash = hashOf('availability-absent');
      const response = await authed(
        baseApp.get(`/api/blob/${encodeURIComponent(hash)}/availability`),
        token,
      );
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });
    });

    it('reports a held hash as available with its size', async () => {
      const content = Buffer.from('availability-held');
      await pushWhole(hashOf(content), content);

      const response = await authed(
        baseApp.get(`/api/blob/${encodeURIComponent(hashOf(content))}/availability`),
        token,
      );
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
        size: content.length,
      });
    });

    it('rejects a malformed hash', async () => {
      const response = await authed(baseApp.get('/api/blob/not-a-hash/availability'), token);
      expect(response).toHaveRequestError();
    });
  });

  describe('push', () => {
    it('accepts an offered blob in offset-addressed chunks and acknowledges once verified', async () => {
      const content = Buffer.from('pushed across two chunks');
      const hash = hashOf(content);

      const offered = await offer(hash, content.length);
      expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });

      const first = await putChunk(hash, content.subarray(0, 10), 0, content.length);
      expect(first).toHaveSucceeded();
      expect(first.body).toEqual({ acknowledged: false, receivedBytes: 10 });

      // an interrupted push re-offers and resumes from the staged bytes
      const reoffered = await offer(hash, content.length);
      expect(reoffered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 10 });

      const second = await putChunk(hash, content.subarray(10), 10, content.length);
      expect(second).toHaveSucceeded();
      expect(second.body).toEqual({ acknowledged: true, existed: false, size: content.length });

      const row = await models.Blob.findOne({ where: { hash } });
      expect(row).toMatchObject({ size: content.length, integrityState: 'verified' });
    });

    it('skips the byte transfer for content it already holds', async () => {
      const content = Buffer.from('push idempotency');
      const hash = hashOf(content);
      await pushWhole(hash, content);

      const reoffered = await offer(hash, content.length);
      expect(reoffered.body).toEqual({ status: BLOB_OFFER_STATUSES.ALREADY_STORED });

      const rePut = await putChunk(hash, content, 0, content.length);
      expect(rePut).toHaveSucceeded();
      expect(rePut.body).toEqual({ acknowledged: true, existed: true });
    });

    it('rejects delivered content that does not hash to the offered hash, discarding it', async () => {
      const claimed = hashOf('the real content');
      const wrong = Buffer.from('not the real content');

      await offer(claimed, wrong.length);
      const put = await putChunk(claimed, wrong, 0, wrong.length);
      expect(put.status).toBe(409);
      expect(put.body.type).toContain('blob-hash-mismatch');

      // staging was discarded, so a clean retry starts over
      const reoffered = await offer(claimed, wrong.length);
      expect(reoffered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });
    });

    it('rejects a chunk whose offset does not match the staged bytes', async () => {
      const content = Buffer.from('offset mismatch push');
      const hash = hashOf(content);

      const put = await putChunk(hash, content.subarray(5), 5, content.length);
      expect(put).toHaveRequestError();

      const offered = await offer(hash, content.length);
      expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });
    });

    it('rejects and discards staging that overruns the declared total', async () => {
      const content = Buffer.from('overrun push');
      const hash = hashOf(content);

      const put = await putChunk(hash, content, 0, 5);
      expect(put).toHaveRequestError();

      const offered = await offer(hash, content.length);
      expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });
    });

    it('accepts a zero-byte blob', async () => {
      const offered = await offer(EMPTY_HASH, 0);
      expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });

      const put = await putChunk(EMPTY_HASH, Buffer.alloc(0), 0, 0);
      expect(put).toHaveSucceeded();
      expect(put.body).toEqual({ acknowledged: true, existed: false, size: 0 });
    });
  });

  describe('fetch', () => {
    beforeAll(async () => {
      await pushWhole(HELLO_HASH, HELLO);
    });

    it('streams held content with the hash as entity tag', async () => {
      const response = await authed(
        baseApp.get(`/api/blob/${encodeURIComponent(HELLO_HASH)}`),
        token,
      ).buffer(true);
      expect(response).toHaveSucceeded();
      expect(response.headers['content-type']).toBe('application/octet-stream');
      expect(response.headers['content-length']).toBe(String(HELLO.length));
      expect(response.headers.etag).toBe(`"${HELLO_HASH}"`);
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(Buffer.from(response.body).equals(HELLO)).toBe(true);
    });

    it('serves an open-ended range so an interrupted fetch resumes', async () => {
      const response = await authed(baseApp.get(`/api/blob/${encodeURIComponent(HELLO_HASH)}`), token)
        .set('range', 'bytes=6-')
        .buffer(true);
      expect(response.status).toBe(206);
      expect(response.headers['content-range']).toBe(`bytes 6-10/${HELLO.length}`);
      expect(Buffer.from(response.body).toString()).toBe('world');
    });

    it('serves a closed range', async () => {
      const response = await authed(baseApp.get(`/api/blob/${encodeURIComponent(HELLO_HASH)}`), token)
        .set('range', 'bytes=0-4')
        .buffer(true);
      expect(response.status).toBe(206);
      expect(Buffer.from(response.body).toString()).toBe('hello');
    });

    it('rejects an unsatisfiable range', async () => {
      const response = await authed(baseApp.get(`/api/blob/${encodeURIComponent(HELLO_HASH)}`), token)
        .set('range', `bytes=${HELLO.length}-`)
        .buffer(true);
      expect(response.status).toBe(416);
      expect(response.headers['content-range']).toBe(`bytes */${HELLO.length}`);
    });

    it('responds to an unheld hash with the availability state evident', async () => {
      const hash = hashOf('fetch-absent');
      const response = await authed(baseApp.get(`/api/blob/${encodeURIComponent(hash)}`), token);
      expect(response.status).toBe(404);
      expect(response.body.availability).toBe(BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD);
    });
  });
});
