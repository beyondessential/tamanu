import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { BLOB_TIERS, DOCUMENT_SIZE_LIMIT } from '@tamanu/constants';
import { BlobStore } from '@tamanu/database/blobStore';
import { InsufficientStorageError } from '@tamanu/errors';
import { fake } from '@tamanu/fake-data/fake';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';

import { createTestContext } from '../utilities';
import { FacilityBlobCache } from '../../app/blobCache/FacilityBlobCache';

jest.mock('@tamanu/shared/utils/getUploadedData');

// The route suites run against a mocked uploadAttachment; this one is about the
// real thing, so it reaches past that mock.
const { uploadAttachment } = jest.requireActual('../../app/utils/uploadAttachment');

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

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
    // Central is unreachable throughout: creating an attachment must not need it.
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

  const stageUpload = async () => {
    const content = Buffer.from(`uploaded document ${randomUUID()}`);
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

  it('admits an uploaded document to the outbox alongside its attachment', async () => {
    // verifies spec: ATCH — creation completes without central connectivity, at
    // the outbox tier, and the background pusher delivers the bytes afterwards
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
    // verifies spec: ATCH, CAP — the refusal fails the upload at the time it is
    // attempted, leaving neither an attachment nor a blob behind
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

  // A facility runs no equivalent of mobile's reconcileAttachments, so nothing
  // demotes a blob whose attachment write failed after admission. Marked failing
  // until one exists: the assertion below is the guarantee, not the behaviour.
  it.failing('leaves no outbox row when the attachment record write fails', async () => {
    // verifies spec: CACHE — a blob whose referencing record is never created is
    // not left in the outbox, where a facility can neither push it nor evict it
    const { hash } = await stageUpload();

    await expect(
      uploadAttachment({ models, blobCache }, DOCUMENT_SIZE_LIMIT, {
        patientId: 'patient-that-does-not-exist',
      }),
    ).rejects.toThrow();

    expect(await models.Attachment.findOne({ where: { hash } })).toBeNull();
    expect(await outboxRowFor(hash)).toBeNull();
  });
});
