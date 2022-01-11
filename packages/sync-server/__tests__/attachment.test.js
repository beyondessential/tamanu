import { createTestContext } from './utilities';

// Mock image to be created with fs module. Expected size of 1002 bytes.
const FILEDATA =
  '/9j/4AAQSkZJRgABAQEAeAB4AAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAHACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7N0z9nH9sCD9q7TtV1rVPGGp/D1PjBZavFa2PiVo1s/DS6548leO5jXWYDcxiC+8NyMq7VFuLKBrG8/s+W3kNN+Gn7VGq/s3aPofiDwd8cJ9UPw1+F+naylh8RNOtNTuNU0XxPOPFUcV5FrEbx3mo6XIkq3STIJ4UCTTxTKsNFFAGh4q+FH7ZPhj9nvwX4W0O28Qa14g+I3wV0DwB4m1e48Xxfafh54ht9G16K81qSdr1H+0Pqeo6I73dkLyaSDTL07DKlmJeA8Z/su/tkz/FP4har4d/4XBY2tt8QLnxHpy3PxNie2161t5vH11aRadE2pSRWVvLDdeD7RYLm3Fqs8UUlzYXdvbzxylFAHr8Pwo/ag1n49fDOSC2+IGi6f4Y+IHjmTUtUvvF9rJpF1o914x0zUdPmntY72R7q3k8Nf2vptrFLbPJZ3MkR8q1VIruMoooA//Z';

describe('Attachment (sync-server)', () => {
  let baseApp;
  let models;
  let app;

  test.todo('all sync server attachment tests');
  /*

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });

  it('should create an attachment', async () => {
    const result = await app.post('attachment').send({
      type: 'image/jpeg',
      size: 1002,
      data: FILEDATA,
    });
    expect(result).toHaveSucceeded();
  });

  */
});
