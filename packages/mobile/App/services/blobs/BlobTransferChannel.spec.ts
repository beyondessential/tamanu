import { BLOB_AVAILABILITY_STATES, BLOB_OFFER_STATUSES, BLOB_TIERS } from '@tamanu/constants';

import { Database } from '~/infra/db';
import { FakeBlobFileSystem, sha256Hash } from '/root/tests/helpers/fakeBlobFileSystem';
import { MobileBlobStore } from './MobileBlobStore';
import { BlobAwaitingUploadError, BlobTransferChannel } from './BlobTransferChannel';
import { deriveFreeDiskReserveBytes } from './deviceStorage';

describe('BlobTransferChannel', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;
  let centralServer: any;
  let channel: BlobTransferChannel;

  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.Blob.getRepository().clear();
    fs = new FakeBlobFileSystem();
    store = new MobileBlobStore({
      root: '/blobs',
      models: Database.models,
      getFreeDiskReserveBytes: deriveFreeDiskReserveBytes,
      fs,
    });
    centralServer = {
      get: jest.fn(),
      post: jest.fn(),
      refresh: jest.fn(),
      apiUrl: (path: string) => `https://central/api/${path}`,
      authHeaders: () => ({ Authorization: 'Bearer test' }),
    };
    channel = new BlobTransferChannel({
      blobStore: store,
      centralServer,
      getFacilityId: async () => 'facility-a',
      fs,
    });
  });

  describe('availability', () => {
    // verifies spec: XFER — held locally is available
    it('reports available when the blob is held locally', async () => {
      fs.seed('/tmp/a.jpg', 'here');
      const { hash } = await store.putFile('/tmp/a.jpg');
      expect(await channel.availability(hash)).toMatchObject({
        availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
      });
      expect(centralServer.get).not.toHaveBeenCalled();
    });

    // verifies spec: XFER — central holds it → awaiting our fetch
    it('reports awaiting-fetch when central holds a blob the device does not', async () => {
      const hash = sha256Hash('remote');
      centralServer.get.mockResolvedValue({
        availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
        size: 6,
      });
      expect(await channel.availability(hash)).toMatchObject({
        availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH,
        size: 6,
      });
    });

    // verifies spec: XFER — central lacks it → awaiting upload from origin
    it('reports awaiting-upload when neither the device nor central holds it', async () => {
      const hash = sha256Hash('nowhere');
      centralServer.get.mockResolvedValue({
        availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
      });
      expect(await channel.availability(hash)).toMatchObject({
        availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
      });
    });
  });

  describe('fetchFromCentral', () => {
    // verifies spec: XFER, MOB — fetch by hash, verify, admit
    it('downloads a blob, verifies it, and admits it to the store', async () => {
      const content = 'downloaded content';
      const hash = sha256Hash(content);
      centralServer.get.mockResolvedValue({
        availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
        size: content.length,
      });
      fs.onDownload = async ({ toFile }) => {
        fs.seed(toFile, content);
        return { statusCode: 200, bytesWritten: content.length };
      };

      const result = await channel.fetchFromCentral(hash);
      expect(result).toMatchObject({ hash, existed: false });
      expect(await store.has(hash)).toBe(true);
    });

    // verifies spec: XFER — an interrupted download resumes from staged bytes
    it('resumes a ranged download from the bytes already staged', async () => {
      const content = 'abcdefghij';
      const hash = sha256Hash(content);
      centralServer.get.mockResolvedValue({
        availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
        size: content.length,
      });
      let call = 0;
      fs.onDownload = async ({ toFile, headers }) => {
        call += 1;
        if (call === 1) {
          // first response delivers only the first half, then "drops"
          fs.seed(toFile, content.slice(0, 5));
          return { statusCode: 200, bytesWritten: 5 };
        }
        // resume request carries a range header for the remainder
        expect(headers.range).toBe('bytes=5-');
        fs.seed(toFile, content.slice(5));
        return { statusCode: 206, bytesWritten: 5 };
      };

      const result = await channel.fetchFromCentral(hash);
      expect(result.hash).toBe(hash);
      expect(await store.has(hash)).toBe(true);
      expect(call).toBe(2);
    });

    // verifies spec: MOB, XFER — content-pending at the source raises awaiting-upload
    it('raises awaiting-upload when central does not hold the bytes', async () => {
      const hash = sha256Hash('pending');
      centralServer.get.mockResolvedValue({
        availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
      });
      await expect(channel.fetchFromCentral(hash)).rejects.toBeInstanceOf(BlobAwaitingUploadError);
    });

    it('skips the transfer when the content is already held', async () => {
      fs.seed('/tmp/held.jpg', 'have it');
      const { hash } = await store.putFile('/tmp/held.jpg');
      const result = await channel.fetchFromCentral(hash);
      expect(result.existed).toBe(true);
      expect(centralServer.get).not.toHaveBeenCalled();
    });

    // A refresh that doesn't clear the rejection must give up rather than spin the
    // request loop forever on a battery-powered device. Uses real timers because
    // the give-up path backs off between attempts.
    it('gives up on repeated unauthenticated responses instead of looping', async () => {
      jest.useRealTimers();
      try {
        const hash = sha256Hash('never arrives');
        centralServer.get.mockResolvedValue({
          availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
          size: 13,
        });
        let downloads = 0;
        fs.onDownload = async () => {
          downloads += 1;
          return { statusCode: 401, bytesWritten: 0 };
        };

        await expect(channel.fetchFromCentral(hash)).rejects.toThrow(/unauthenticated/i);
        expect(downloads).toBeLessThanOrEqual(5);
        expect(centralServer.refresh).toHaveBeenCalled();
      } finally {
        jest.useFakeTimers();
      }
    }, 20000);
  });

  describe('pushToCentral', () => {
    // verifies spec: XFER — deliver a held blob and receive acknowledgement
    it('offers and delivers a held blob, returning acknowledgement', async () => {
      fs.seed('/tmp/push.jpg', 'push me up');
      const { hash } = await store.putFile('/tmp/push.jpg', { tier: BLOB_TIERS.OUTBOX });
      centralServer.post.mockResolvedValue({
        status: BLOB_OFFER_STATUSES.WANTED,
        receivedBytes: 0,
      });
      fs.onUpload = async () => ({ statusCode: 200, body: JSON.stringify({ acknowledged: true }) });

      const result = await channel.pushToCentral(hash);
      expect(result.acknowledged).toBe(true);
      expect(centralServer.post).toHaveBeenCalled();
    });

    // verifies spec: XFER — idempotent when central already holds it
    it('acknowledges without transfer when central already stores the content', async () => {
      fs.seed('/tmp/dup.jpg', 'already there');
      fs.onUpload = jest.fn();
      const { hash } = await store.putFile('/tmp/dup.jpg', { tier: BLOB_TIERS.OUTBOX });
      centralServer.post.mockResolvedValue({ status: BLOB_OFFER_STATUSES.ALREADY_STORED });

      const result = await channel.pushToCentral(hash);
      expect(result).toMatchObject({ acknowledged: true, existed: true });
      expect(fs.onUpload).not.toHaveBeenCalled();
    });

    // verifies spec: SCRUB, MOB — verify an outbox blob before offering it
    it('marks corrupt outbox content rather than offering it', async () => {
      fs.seed('/tmp/good.jpg', 'good bytes');
      const { hash } = await store.putFile('/tmp/good.jpg', { tier: BLOB_TIERS.OUTBOX });
      // corrupt the stored bytes after admission
      fs.seed(store.pathFor(hash), 'tampered');

      await expect(channel.pushToCentral(hash)).rejects.toThrow(/corrupt/i);
      expect(centralServer.post).not.toHaveBeenCalled();
      const row = await Database.models.Blob.findOne({ where: { hash } });
      expect(row.integrityState).toBe('corrupt');
    });
  });
});
