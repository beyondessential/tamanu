import { writeFileSync } from 'fs';
import { InvalidParameterError, RemoteCallFailedError } from 'shared/errors';
import { getUploadedData } from 'shared/utils/getUploadedData';

import { CentralServerConnection } from '../app/sync/CentralServerConnection';
// Get the unmocked function to be able to test it
const { uploadAttachment } = jest.requireActual('../app/utils/uploadAttachment');

// Mock image to be created with fs module. Expected size of 1002 bytes.
const FILEDATA =
  '/9j/4AAQSkZJRgABAQEAeAB4AAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAHACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7N0z9nH9sCD9q7TtV1rVPGGp/D1PjBZavFa2PiVo1s/DS6548leO5jXWYDcxiC+8NyMq7VFuLKBrG8/s+W3kNN+Gn7VGq/s3aPofiDwd8cJ9UPw1+F+naylh8RNOtNTuNU0XxPOPFUcV5FrEbx3mo6XIkq3STIJ4UCTTxTKsNFFAGh4q+FH7ZPhj9nvwX4W0O28Qa14g+I3wV0DwB4m1e48Xxfafh54ht9G16K81qSdr1H+0Pqeo6I73dkLyaSDTL07DKlmJeA8Z/su/tkz/FP4har4d/4XBY2tt8QLnxHpy3PxNie2161t5vH11aRadE2pSRWVvLDdeD7RYLm3Fqs8UUlzYXdvbzxylFAHr8Pwo/ag1n49fDOSC2+IGi6f4Y+IHjmTUtUvvF9rJpF1o914x0zUdPmntY72R7q3k8Nf2vptrFLbPJZ3MkR8q1VIruMoooA//Z';

const mockSyncConfig = {
  sync: true,
};
const mockReq = {
  name: 'hello world image',
  type: 'image/jpeg',
  deviceId: 'test-device-id',
  settings: {
    get: () => mockSyncConfig,
  },
};

// Function called inside uploadAttachment, it expects a network request
// with multipart/form-data which doesn't seem very straightforward to
// recreate within node.
jest.mock('shared/utils/getUploadedData');
getUploadedData.mockImplementation(async req => {
  // Create a file that can be used with the FS module, return path
  const fileName = 'test-file.jpeg';
  writeFileSync(fileName, FILEDATA, { encoding: 'base64' });
  return {
    file: fileName,
    deleteFileAfterImport: true,
    ...req,
  };
});

describe('UploadAttachment', () => {
  it('abort uploading file if its above permitted max file size', async () => {
    await expect(uploadAttachment(mockReq, 1000)).rejects.toThrow(InvalidParameterError);
    expect(CentralServerConnection.mock.calls.length).toBe(0);
  });

  it('abort creating document metadata if the sync server fails to create attachment', async () => {
    CentralServerConnection.mockImplementationOnce(() => ({
      __esModule: true,
      fetch: jest.fn(async (path, body) => {
        // Make sure the parameters match what the sync server expects
        expect(path).toBe('attachment');
        expect(body).toMatchObject({
          method: 'POST',
          body: {
            type: 'image/jpeg',
            size: 1002,
            data: FILEDATA,
          },
        });
        return {
          error: 'Some error',
        };
      }),
    }));
    const { deviceId, settings } = mockReq;
    await expect(uploadAttachment(mockReq)).rejects.toThrow(RemoteCallFailedError);
    expect(CentralServerConnection.mock.calls.length).toBe(1);
    expect(CentralServerConnection).toBeCalledWith({ deviceId, settings }, mockSyncConfig);
  });

  it('successfully uploads attachment', async () => {
    CentralServerConnection.mockImplementationOnce(() => ({
      __esModule: true,
      fetch: jest.fn(async (path, body) => {
        // Make sure the parameters match what the sync server expects
        expect(path).toBe('attachment');
        expect(body).toMatchObject({
          method: 'POST',
          body: {
            type: 'image/jpeg',
            size: 1002,
            data: FILEDATA,
          },
        });
        return {
          attachmentId: '111',
        };
      }),
    }));
    const result = await uploadAttachment(mockReq);
    const { deviceId, settings } = mockReq;
    expect(result).toMatchObject({
      attachmentId: '111',
      type: 'image/jpeg',
      metadata: { name: 'hello world image' },
    });
    expect(CentralServerConnection.mock.calls.length).toBe(2);
    expect(CentralServerConnection).toBeCalledWith({ deviceId, settings }, mockSyncConfig);
  });
});
