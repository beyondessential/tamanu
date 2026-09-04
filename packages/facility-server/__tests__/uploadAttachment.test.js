import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import { InvalidParameterError } from '@tamanu/errors';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';

// Get the unmocked function to be able to test it
const { uploadAttachment } = await vi.importActual('../app/utils/uploadAttachment');

// Mock image to be created with fs module. Expected size of 1002 bytes.
const FILEDATA =
  '/9j/4AAQSkZJRgABAQEAeAB4AAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAHACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7N0z9nH9sCD9q7TtV1rVPGGp/D1PjBZavFa2PiVo1s/DS6548leO5jXWYDcxiC+8NyMq7VFuLKBrG8/s+W3kNN+Gn7VGq/s3aPofiDwd8cJ9UPw1+F+naylh8RNOtNTuNU0XxPOPFUcV5FrEbx3mo6XIkq3STIJ4UCTTxTKsNFFAGh4q+FH7ZPhj9nvwX4W0O28Qa14g+I3wV0DwB4m1e48Xxfafh54ht9G16K81qSdr1H+0Pqeo6I73dkLyaSDTL07DKlmJeA8Z/su/tkz/FP4har4d/4XBY2tt8QLnxHpy3PxNie2161t5vH11aRadE2pSRWVvLDdeD7RYLm3Fqs8UUlzYXdvbzxylFAHr8Pwo/ag1n49fDOSC2+IGi6f4Y+IHjmTUtUvvF9rJpF1o914x0zUdPmntY72R7q3k8Nf2vptrFLbPJZ3MkR8q1VIruMoooA//Z';

// Function called inside uploadAttachment, it expects a network request
// with multipart/form-data which doesn't seem very straightforward to
// recreate within node.
vi.mock('@tamanu/shared/utils/getUploadedData');
getUploadedData.mockImplementation(async req => {
  // Create a file that can be used with the FS module, return path
  const fileName = path.resolve(__dirname, 'test-file.jpeg');
  await fs.writeFile(fileName, FILEDATA, { encoding: 'base64' });
  return {
    file: fileName,
    deleteFileAfterImport: true,
    ...req,
  };
});

const readAll = async stream => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

describe('UploadAttachment', () => {
  let admitted;
  let created;
  let mockReq;

  beforeEach(() => {
    admitted = [];
    created = [];
    mockReq = {
      name: 'hello world image',
      type: 'image/jpeg',
      deviceId: 'test-device-id',
      blobCache: {
        putOutbox: vi.fn(async (source, options) => {
          const content = await readAll(source);
          admitted.push({ content, options });
          return {
            hash: `sha256:${createHash('sha256').update(content).digest('hex')}`,
            size: content.length,
          };
        }),
      },
      models: {
        Attachment: {
          create: vi.fn(async values => {
            created.push(values);
            return { id: 'attachment-id', ...values };
          }),
        },
      },
    };
  });

  it('abort uploading file if its above permitted max file size', async () => {
    await expect(uploadAttachment(mockReq, 1000)).rejects.toThrow(InvalidParameterError);
    // spec: ATCH — nothing is admitted for a rejected upload, so an oversized
    // file leaves no unreferenced blob in the outbox.
    expect(mockReq.blobCache.putOutbox).not.toHaveBeenCalled();
    expect(mockReq.models.Attachment.create).not.toHaveBeenCalled();
  });

  // spec: ATCH
  it('admits the content to the outbox and records it on the attachment', async () => {
    const result = await uploadAttachment(mockReq, 10000, { patientId: 'patient-id' });

    expect(admitted).toHaveLength(1);
    expect(admitted[0].content).toEqual(Buffer.from(FILEDATA, 'base64'));

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      type: 'image/jpeg',
      hash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
      patientId: 'patient-id',
    });
    expect(created[0].data).toBeUndefined();

    expect(result).toMatchObject({
      attachmentId: 'attachment-id',
      type: 'image/jpeg',
      metadata: { name: 'hello world image' },
    });
  });

  // spec: ATCH
  it('records the size of the bytes actually admitted', async () => {
    await uploadAttachment(mockReq, 10000);
    expect(created[0].size).toBe(Buffer.from(FILEDATA, 'base64').length);
  });
});
