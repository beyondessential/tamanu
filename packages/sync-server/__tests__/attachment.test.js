import { canUploadAttachment } from '../app/utils/getFreeDiskSpace';
import { createTestContext } from './utilities';
import { makePermissionsForRole } from './permissions';

// Mock image to be created with fs module. Expected size of 1002 bytes.
const FILEDATA =
  '/9j/4AAQSkZJRgABAQEAeAB4AAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAHACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7N0z9nH9sCD9q7TtV1rVPGGp/D1PjBZavFa2PiVo1s/DS6548leO5jXWYDcxiC+8NyMq7VFuLKBrG8/s+W3kNN+Gn7VGq/s3aPofiDwd8cJ9UPw1+F+naylh8RNOtNTuNU0XxPOPFUcV5FrEbx3mo6XIkq3STIJ4UCTTxTKsNFFAGh4q+FH7ZPhj9nvwX4W0O28Qa14g+I3wV0DwB4m1e48Xxfafh54ht9G16K81qSdr1H+0Pqeo6I73dkLyaSDTL07DKlmJeA8Z/su/tkz/FP4har4d/4XBY2tt8QLnxHpy3PxNie2161t5vH11aRadE2pSRWVvLDdeD7RYLm3Fqs8UUlzYXdvbzxylFAHr8Pwo/ag1n49fDOSC2+IGi6f4Y+IHjmTUtUvvF9rJpF1o914x0zUdPmntY72R7q3k8Nf2vptrFLbPJZ3MkR8q1VIruMoooA//Z';

describe('Attachment (sync-server)', () => {
  let ctx;
  let baseApp;
  let models;
  let role;
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

  afterAll(async () => ctx.close());

  it('should send an error if attachment does not exist', async () => {
    const result = await app.get('/v1/attachment/1');
    expect(result).toBeForbidden();
  });

  it('should read an attachment as a buffer', async () => {
    const result = await app.get(`/v1/attachment/${attachment.id}`);
    expect(result).toHaveSucceeded();
    expect(Buffer.isBuffer(result.body)).toBeTruthy();
  });

  it('should read an attachment as a base64 string', async () => {
    const result = await app.get(`/v1/attachment/${attachment.id}?base64=true`);
    expect(result).toHaveSucceeded();
    const receivedStr = result.body.data;
    expect(typeof receivedStr).toBe('string');
    // Buffer.from will ignore non-base64 characters
    // so if the string remains the same after re-encoding
    // we could assume it is a valid base64 string
    const reEncodedStr = Buffer.from(receivedStr, 'base64').toString('base64');
    expect(receivedStr).toBe(reEncodedStr);
  });

  it('should send error if there is no enough disk space', async () => {
    canUploadAttachment.mockImplementationOnce(async () => false);
    const result = await app.post('/v1/attachment').send({
      type: 'image/jpeg',
      size: 1002,
      data: FILEDATA,
    });
    expect(result.body.error).toBeTruthy();
    expect(result.body.error.message).toBe(
      'Document cannot be uploaded due to lack of storage space.',
    );
    expect(result.body.error.name).toBe('InsufficientStorageError');
  });

  it('should create an attachment and receive its ID back', async () => {
    canUploadAttachment.mockImplementationOnce(async () => true);
    const result = await app.post('/v1/attachment').send({
      type: 'image/jpeg',
      size: 1002,
      data: FILEDATA,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.attachmentId).toBeTruthy();
    const createdAttachment = await models.Attachment.findByPk(result.body.id);
    expect(createdAttachment).toBeDefined();
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

      canUploadAttachment.mockImplementationOnce(async () => true);
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

      canUploadAttachment.mockImplementationOnce(async () => true);
      const result = await app.post('/v1/attachment').send({
        type: 'image/jpeg',
        size: 1002,
        data: FILEDATA,
      });

      expect(result).toBeForbidden();
    });
  });
});
