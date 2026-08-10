import { Readable } from 'node:stream';

import { BLOB_INTEGRITY_STATES, MAX_INLINE_BLOB_BYTES } from '@tamanu/constants';
import { InsufficientStorageError } from '@tamanu/errors';

import { createTestContext } from './utilities';

// Mock image to be created with fs module. Expected size of 1002 bytes.
const FILEDATA =
  '/9j/4AAQSkZJRgABAQEAeAB4AAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAHACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7N0z9nH9sCD9q7TtV1rVPGGp/D1PjBZavFa2PiVo1s/DS6548leO5jXWYDcxiC+8NyMq7VFuLKBrG8/s+W3kNN+Gn7VGq/s3aPofiDwd8cJ9UPw1+F+naylh8RNOtNTuNU0XxPOPFUcV5FrEbx3mo6XIkq3STIJ4UCTTxTKsNFFAGh4q+FH7ZPhj9nvwX4W0O28Qa14g+I3wV0DwB4m1e48Xxfafh54ht9G16K81qSdr1H+0Pqeo6I73dkLyaSDTL07DKlmJeA8Z/su/tkz/FP4har4d/4XBY2tt8QLnxHpy3PxNie2161t5vH11aRadE2pSRWVvLDdeD7RYLm3Fqs8UUlzYXdvbzxylFAHr8Pwo/ag1n49fDOSC2+IGi6f4Y+IHjmTUtUvvF9rJpF1o914x0zUdPmntY72R7q3k8Nf2vptrFLbPJZ3MkR8q1VIruMoooA//Z';

describe('Attachment (central-server)', () => {
  let ctx;
  let baseApp;
  let models;
  let app;
  let attachment;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    app = await baseApp.asRole('practitioner');
    attachment = await models.Attachment.create({
      type: 'image/jpeg',
      size: 1002,
      data: FILEDATA,
    });
  });

  afterAll(async () => ctx.close());

  beforeEach(async () => {
    await models.Permission.truncate({ force: true });

    app = await baseApp.asNewRole(
      [
        ['read', 'Attachment'],
        ['create', 'Attachment'],
      ],
      { id: 'practitioner' },
    );
  });

  it('should send an error if attachment does not exist', async () => {
    const result = await app.get('/api/attachment/1');
    expect(result).toBeForbidden();
  });

  it('should read an attachment as a buffer', async () => {
    const result = await app.get(`/api/attachment/${attachment.id}`);
    expect(result).toHaveSucceeded();
    expect(Buffer.isBuffer(result.body)).toBeTruthy();
  });

  it('should read an attachment as a base64 string', async () => {
    const result = await app.get(`/api/attachment/${attachment.id}?base64=true`);
    expect(result).toHaveSucceeded();
    const receivedStr = result.body.data;
    expect(typeof receivedStr).toBe('string');
    // Buffer.from will ignore non-base64 characters
    // so if the string remains the same after re-encoding
    // we could assume it is a valid base64 string
    const reEncodedStr = Buffer.from(receivedStr, 'base64').toString('base64');
    expect(receivedStr).toBe(reEncodedStr);
  });

  // spec: ATCH
  // The store refuses admission rather than cross the host's free-disk reserve,
  // and the route surfaces that as the upload's rejection (see capacity.md).
  it('should send error if there is no enough disk space', async () => {
    jest
      .spyOn(ctx.blobStore, 'put')
      .mockRejectedValueOnce(
        new InsufficientStorageError('Document cannot be uploaded due to lack of storage space.'),
      );
    const result = await app.post('/api/attachment').send({
      type: 'image/jpeg',
      size: 1002,
      data: FILEDATA,
    });
    expect(result.body.error).toBeTruthy();
    expect(result.body.error.name).toBe('InsufficientStorageError');
  });

  it('should create an attachment and receive its ID back', async () => {
    const result = await app.post('/api/attachment').send({
      type: 'image/jpeg',
      size: 1002,
      data: FILEDATA,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.attachmentId).toBeTruthy();
    const createdAttachment = await models.Attachment.findByPk(result.body.attachmentId);
    expect(createdAttachment).toBeDefined();
  });

  // spec: ATCH, BLAC
  // Scope cannot be set from the request body: a client must not be able to
  // scope an attachment to an arbitrary patient or encounter.
  it('ignores patient and encounter scope supplied in the request body', async () => {
    const result = await app.post('/api/attachment').send({
      type: 'image/jpeg',
      size: 1002,
      data: FILEDATA,
      patientId: 'attacker-supplied-patient',
      encounterId: 'attacker-supplied-encounter',
    });
    expect(result).toHaveSucceeded();
    const created = await models.Attachment.findByPk(result.body.attachmentId);
    expect(created.patientId).toBeFalsy();
    expect(created.encounterId).toBeFalsy();
  });

  // spec: ATCH
  describe('Blob-backed attachments', () => {
    const CONTENT = Buffer.from('a stored attachment body, long enough to range over', 'utf8');
    let stored;

    beforeAll(async () => {
      const { hash, size } = await ctx.blobStore.put(Readable.from([CONTENT]));
      stored = await models.Attachment.create({ type: 'text/plain', hash, size });
    });

    it('stores an uploaded attachment in the blob store, not the database row', async () => {
      const result = await app.post('/api/attachment').send({
        type: 'image/jpeg',
        size: 1002,
        data: FILEDATA,
      });
      expect(result).toHaveSucceeded();
      const created = await models.Attachment.findByPk(result.body.attachmentId);
      expect(created.hash).toBeTruthy();
      expect(created.data).toBeFalsy();
      expect(await ctx.blobStore.has(created.hash)).toBe(true);
    });

    it('records the size of the bytes actually admitted, not the declared size', async () => {
      const result = await app.post('/api/attachment').send({
        type: 'image/jpeg',
        size: 7, // a caller's declaration the admitted bytes contradict
        data: FILEDATA,
      });
      expect(result).toHaveSucceeded();
      const created = await models.Attachment.findByPk(result.body.attachmentId);
      expect(Number(created.size)).toBe(Buffer.from(FILEDATA, 'base64').length);
    });

    it('serves the content from the store with the hash as entity tag', async () => {
      const result = await app.get(`/api/attachment/${stored.id}`);
      expect(result).toHaveSucceeded();
      expect(result.headers.etag).toBe(`"${stored.hash}"`);
      expect(result.headers['accept-ranges']).toBe('bytes');
      expect(result.headers['content-type']).toContain('text/plain');
      expect(result.text).toBe(CONTENT.toString('utf8'));
    });

    it('serves a requested byte range of the content', async () => {
      const result = await app.get(`/api/attachment/${stored.id}`).set('range', 'bytes=5-14');
      expect(result.status).toBe(206);
      expect(result.headers['content-range']).toBe(`bytes 5-14/${CONTENT.length}`);
      expect(result.text).toBe(CONTENT.subarray(5, 15).toString('utf8'));
    });

    it('refuses an unsatisfiable range with the content extent', async () => {
      const result = await app
        .get(`/api/attachment/${stored.id}`)
        .set('range', `bytes=${CONTENT.length}-`);
      expect(result.status).toBe(416);
      expect(result.headers['content-range']).toBe(`bytes */${CONTENT.length}`);
    });

    it('serves the content base64-encoded for clients that consume it inline', async () => {
      const result = await app.get(`/api/attachment/${stored.id}?base64=true`);
      expect(result).toHaveSucceeded();
      expect(result.body.data).toBe(CONTENT.toString('base64'));
    });

    // spec: SERVE
    // Inline encoding holds the whole content in memory, so content past the
    // limit is refused that way and the caller directed to stream it.
    it('refuses to encode content past the inline limit', async () => {
      jest.spyOn(ctx.blobStore, 'servableStat').mockResolvedValueOnce({
        size: MAX_INLINE_BLOB_BYTES + 1,
        integrityState: BLOB_INTEGRITY_STATES.VERIFIED,
      });

      const result = await app.get(`/api/attachment/${stored.id}?base64=true`);
      expect(result).toHaveRequestError(422);

      const streamed = await app.get(`/api/attachment/${stored.id}`);
      expect(streamed).toHaveSucceeded();
    });

    // spec: ATCH
    // Central holds the record but not yet the bytes: the origin has synced its
    // attachment but not pushed its content. It presents as awaiting upload, not
    // a crash on the missing blob.
    it('presents a hash-backed attachment whose bytes central lacks as awaiting content', async () => {
      const pending = await models.Attachment.create({
        type: 'application/pdf',
        hash: `sha256:${'c'.repeat(64)}`,
        size: 10,
      });

      const result = await app.get(`/api/attachment/${pending.id}`);
      expect(result.status).toBe(202);
      expect(result.body).toMatchObject({
        attachmentId: pending.id,
        availability: 'awaiting-upload',
      });
    });

    // spec: SCRUB
    // A quarantined copy is retained but never served, and the transfer routes
    // answer for it exactly as they do for content central does not hold. This
    // route answers the same way, so reading an attachment neither serves the
    // bad bytes nor discloses the quarantine.
    it('presents a quarantined blob as awaiting content, without disclosing the quarantine', async () => {
      const { hash, size } = await ctx.blobStore.put(
        Readable.from([Buffer.from('bytes that later fail verification', 'utf8')]),
      );
      const quarantined = await models.Attachment.create({ type: 'text/plain', hash, size });
      await ctx.blobStore.recordIntegrityState(hash, BLOB_INTEGRITY_STATES.QUARANTINED);

      const result = await app.get(`/api/attachment/${quarantined.id}`);
      expect(result.status).toBe(202);
      expect(result.body).toMatchObject({
        attachmentId: quarantined.id,
        availability: 'awaiting-upload',
      });
      expect(JSON.stringify(result.body)).not.toMatch(/quarantin/i);
    });
  });

  describe('Permissions', () => {
    beforeEach(async () => {
      await models.Permission.truncate({ force: true });
    });

    it('gets an attachment if there is sufficient read Attachment permission', async () => {
      app = await baseApp.asNewRole([['read', 'Attachment']], { id: 'practitioner' });

      const result = await app.get(`/v1/attachment/${attachment.id}?base64=true`);
      expect(result).toHaveSucceeded();
    });

    it('creates an attachment if there is sufficient create Attachment permission', async () => {
      app = await baseApp.asNewRole([['create', 'Attachment']], {
        id: 'practitioner',
      });

      const result = await app.post('/v1/attachment').send({
        type: 'image/jpeg',
        size: 1002,
        data: FILEDATA,
      });
      expect(result).toHaveSucceeded();
    });

    it('rejects getting an attachment if there is no read Attachment permission', async () => {
      app = await baseApp.asNewRole([['create', 'Attachment']], {
        id: 'practitioner',
      });

      const result = await app.get(`/v1/attachment/${attachment.id}?base64=true`);
      expect(result).toBeForbidden();
    });

    it('rejects getting an attachment if there is no create Attachment permission', async () => {
      app = await baseApp.asNewRole([['read', 'Attachment']], { id: 'practitioner' });

      const result = await app.post('/v1/attachment').send({
        type: 'image/jpeg',
        size: 1002,
        data: FILEDATA,
      });

      expect(result).toBeForbidden();
    });
  });
});
