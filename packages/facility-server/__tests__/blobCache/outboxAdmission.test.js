import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { BLOB_TIERS, DOCUMENT_SIZE_LIMIT } from '@tamanu/constants';
import { BlobStore } from '@tamanu/database/blobStore';
import { InsufficientStorageError } from '@tamanu/errors';
import { fake } from '@tamanu/fake-data/fake';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';

import { createTestContext } from '../utilities';
import { BlobOutboxPusher } from '../../app/blobCache/BlobOutboxPusher';
import { FacilityBlobCache } from '../../app/blobCache/FacilityBlobCache';

vi.mock('@tamanu/shared/utils/getUploadedData');

// The route suites mock uploadAttachment; this one is about the real thing.
const { uploadAttachment } = await vi.importActual('../../app/utils/uploadAttachment');

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

const uniqueContent = () => Buffer.from(`blob content ${randomUUID()}`);

describe('outbox admission and the referencing record', () => {
  let ctx;
  let models;
  let root;
  let uploadsRoot;
  let blobStore;
  let blobCache;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    uploadsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'outbox-admission-uploads-'));
  });

  afterAll(async () => {
    await fs.rm(uploadsRoot, { recursive: true, force: true });
    await ctx.close();
  });

  beforeEach(async () => {
    await models.Attachment.destroy({ where: {}, force: true });
    await models.Blob.destroy({ where: {}, force: true });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'outbox-admission-store-'));
    blobStore = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => 0,
    });
    blobCache = new FacilityBlobCache({
      blobStore,
      models,
      getCacheBudgetBytes: async () => 10 * 1024 ** 3,
    });
    blobCache.setTransferChannel({
      fetchFromCentral: async () => {
        throw new Error('central is unreachable');
      },
      pushToCentral: async () => {
        throw new Error('central is unreachable');
      },
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const stageUpload = async (content = Buffer.from(`uploaded document ${randomUUID()}`)) => {
    const file = path.join(uploadsRoot, `upload-${randomUUID()}`);
    await fs.writeFile(file, content);
    getUploadedData.mockResolvedValue({
      file,
      deleteFileAfterImport: false,
      type: 'application/pdf',
      name: 'a scanned referral',
    });
    return { content, hash: hashOf(content) };
  };

  const outboxRowFor = async hash =>
    models.Blob.findOne({ where: { hash, tier: BLOB_TIERS.OUTBOX } });

  const ageBlob = async (hash, msAgo) =>
    models.Blob.update(
      { lastAccessedAt: new Date(Date.now() - msAgo) },
      { where: { hash }, silent: true },
    );

  const BEYOND_SAFETY_WINDOW_MS = 2 * 60 * 60 * 1000;

  it('admits an uploaded document to the outbox alongside its attachment', async () => {
    // verifies spec: ATCH
    const patient = await models.Patient.create(fake(models.Patient));
    const { hash, content } = await stageUpload();

    await uploadAttachment({ models, blobCache }, DOCUMENT_SIZE_LIMIT, { patientId: patient.id });

    const attachment = await models.Attachment.findOne({ where: { hash } });
    expect(attachment).not.toBeNull();
    expect(attachment.size).toBe(content.length);
    expect(attachment.data).toBeNull();
    expect(await outboxRowFor(hash)).not.toBeNull();
  });

  it('rejects an upload the store cannot admit without crossing the free-disk reserve', async () => {
    // verifies spec: ATCH, CAP
    const patient = await models.Patient.create(fake(models.Patient));
    const { hash } = await stageUpload();
    const starvedCache = new FacilityBlobCache({
      blobStore: new BlobStore({
        root,
        models,
        getFreeDiskReserveBytes: async () => Number.MAX_SAFE_INTEGER,
      }),
      models,
      getCacheBudgetBytes: async () => 10 * 1024 ** 3,
    });

    await expect(
      uploadAttachment({ models, blobCache: starvedCache }, DOCUMENT_SIZE_LIMIT, {
        patientId: patient.id,
      }),
    ).rejects.toThrow(InsufficientStorageError);

    expect(await models.Attachment.findOne({ where: { hash } })).toBeNull();
    expect(await models.Blob.findOne({ where: { hash } })).toBeNull();
  });

  it('leaves no outbox row once the sweep reaches an attachment write that failed', async () => {
    // verifies spec: CACHE
    const { hash } = await stageUpload();

    await expect(
      uploadAttachment({ models, blobCache }, DOCUMENT_SIZE_LIMIT, {
        patientId: 'patient-that-does-not-exist',
      }),
    ).rejects.toThrow();
    await ageBlob(hash, BEYOND_SAFETY_WINDOW_MS);
    await blobCache.demoteStrandedOutbox();

    expect(await models.Attachment.findOne({ where: { hash } })).toBeNull();
    expect(await outboxRowFor(hash)).toBeNull();
  });

  it('keeps the bytes of a blob whose attachment write failed, as evictable cache', async () => {
    // verifies spec: CACHE
    const { hash } = await stageUpload();

    await expect(
      uploadAttachment({ models, blobCache }, DOCUMENT_SIZE_LIMIT, {
        patientId: 'patient-that-does-not-exist',
      }),
    ).rejects.toThrow();
    await ageBlob(hash, BEYOND_SAFETY_WINDOW_MS);
    await blobCache.demoteStrandedOutbox();

    expect((await models.Blob.findOne({ where: { hash } })).tier).toBe(BLOB_TIERS.CACHE);
    expect(await blobStore.has(hash)).toBe(true);
  });

  it('keeps content pushable when another upload of the same file fails', async () => {
    // verifies spec: CACHE
    // The successful upload admits first and writes its record last, so the failing upload of the
    // same bytes sees an unreferenced blob.
    const patient = await models.Patient.create(fake(models.Patient));
    const content = Buffer.from(`uploaded document ${randomUUID()}`);
    const { hash, size } = await blobCache.putOutbox(Readable.from(content));

    await stageUpload(content);
    await expect(
      uploadAttachment({ models, blobCache }, DOCUMENT_SIZE_LIMIT, {
        patientId: 'patient-that-does-not-exist',
      }),
    ).rejects.toThrow();

    await models.Attachment.create({ type: 'application/pdf', hash, size, patientId: patient.id });

    const pushed = [];
    await new BlobOutboxPusher({
      models,
      transferChannel: {
        pushToCentral: async offeredHash => {
          pushed.push(offeredHash);
          return { acknowledged: true };
        },
      },
      blobCache,
      referenceResolvers: [async (_models, hashes) => hashes],
    }).runOnce();

    expect(pushed).toEqual([hash]);
    expect((await models.Blob.findOne({ where: { hash } })).tier).toBe(BLOB_TIERS.CACHE);
  });

  describe('stranded outbox sweep', () => {
    it('demotes an outbox blob no record references', async () => {
      // verifies spec: CACHE
      const { hash } = await blobCache.putOutbox(Readable.from(uniqueContent()));
      await ageBlob(hash, BEYOND_SAFETY_WINDOW_MS);

      expect(await blobCache.demoteStrandedOutbox()).toEqual([hash]);

      expect((await models.Blob.findOne({ where: { hash } })).tier).toBe(BLOB_TIERS.CACHE);
      expect(await blobStore.has(hash)).toBe(true);
    });

    it('leaves an outbox blob its attachment still references', async () => {
      const patient = await models.Patient.create(fake(models.Patient));
      const content = uniqueContent();
      const { hash, size } = await blobCache.putOutbox(Readable.from(content));
      await models.Attachment.create({ type: 'application/pdf', hash, size, patientId: patient.id });
      await ageBlob(hash, BEYOND_SAFETY_WINDOW_MS);

      expect(await blobCache.demoteStrandedOutbox()).toEqual([]);

      expect(await outboxRowFor(hash)).not.toBeNull();
    });

    it('leaves an outbox blob admitted within the safety window', async () => {
      // verifies spec: RECL
      const { hash } = await blobCache.putOutbox(Readable.from(uniqueContent()));

      expect(await blobCache.demoteStrandedOutbox()).toEqual([]);

      expect(await outboxRowFor(hash)).not.toBeNull();
    });

    it('reopens the safety window when content already held is admitted again', async () => {
      // verifies spec: RECL
      // A window from first admission would miss content deduplicated onto a moment before its new
      // reference commits.
      const content = uniqueContent();
      const { hash } = await blobCache.putOutbox(Readable.from(content));
      await ageBlob(hash, BEYOND_SAFETY_WINDOW_MS);

      await blobCache.putOutbox(Readable.from(content));

      expect(await blobCache.demoteStrandedOutbox()).toEqual([]);
      expect(await outboxRowFor(hash)).not.toBeNull();
    });
  });
});
