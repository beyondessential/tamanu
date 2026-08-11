import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { QueryTypes } from 'sequelize';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { BLOB_INTEGRITY_STATES, BLOB_SCAN_VERDICTS, type BlobScanVerdict } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { BlobStore } from '../../src/blobStore/BlobStore';
import { getModelsForPull, getModelsForPush } from '../../src/sync/getModelsForDirection';
import { closeDatabase, createTestDatabase } from '../utilities';

const SCANNER_VERSION = 'ClamAV 1.0.5';
const SIGNATURE_VERSION = '27100';

describe('blob registry', () => {
  let models: any;
  let sequelize: any;
  let store: BlobStore;
  let root: string;

  beforeAll(async () => {
    ({ models, sequelize } = await createTestDatabase());
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-registry-'));
    store = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => 0,
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  // Content no other case shares, so every admission is a fresh row rather than
  // an upsert onto one an earlier case or an earlier run left behind.
  const admit = async () => {
    const { hash } = await store.put(Readable.from(Buffer.from(`blob ${randomUUID()}`)));
    return hash;
  };

  // spec: CAS
  describe('locality', () => {
    it('is neither pulled nor pushed by a sync session', () => {
      expect(Object.keys(getModelsForPull(models))).not.toContain('Blob');
      expect(Object.keys(getModelsForPush(models))).not.toContain('Blob');
    });

    it('carries no sync tick column, so no write to it is ever marked for sync', async () => {
      const columns = await sequelize.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'blobs'`,
        { type: QueryTypes.SELECT },
      );

      expect(columns.map((column: any) => column.column_name)).not.toContain(
        'updated_at_sync_tick',
      );
    });

    it('carries no changelog trigger', async () => {
      const triggers = await sequelize.query(
        `SELECT trigger.tgname FROM pg_trigger trigger
         JOIN pg_proc proc ON proc.oid = trigger.tgfoid
         JOIN pg_namespace namespace ON namespace.oid = proc.pronamespace
         WHERE trigger.tgrelid = 'public.blobs'::regclass
           AND NOT trigger.tgisinternal
           AND namespace.nspname = 'logs'
           AND proc.proname = 'record_change'`,
        { type: QueryTypes.SELECT },
      );

      expect(triggers).toEqual([]);
    });

    it('records nothing to the change log when a blob is admitted', async () => {
      // A logged write alongside it, so the case fails rather than passes
      // vacuously if change logging is off in this session.
      const referenceData = await models.ReferenceData.create(fake(models.ReferenceData));
      const hash = await admit();
      const blob = await models.Blob.findOne({ where: { hash } });

      const logged = await sequelize.query(
        `SELECT table_name FROM logs.changes WHERE record_id IN ($blobId, $referenceDataId)`,
        {
          bind: { blobId: blob.id, referenceDataId: referenceData.id },
          type: QueryTypes.SELECT,
        },
      );

      expect(logged.map((entry: any) => entry.table_name)).toEqual(['reference_data']);
    });
  });

  // spec: AV
  describe('scan verdict and integrity state', () => {
    const recordVerdict = async (hash: string, verdict: BlobScanVerdict) =>
      await store.recordScanVerdict(hash, {
        verdict,
        scannerVersion: SCANNER_VERSION,
        signatureVersion: SIGNATURE_VERSION,
      });

    it('records a verdict over content already standing as corrupt, leaving that state', async () => {
      const hash = await admit();
      await store.recordIntegrityState(hash, BLOB_INTEGRITY_STATES.CORRUPT);

      await recordVerdict(hash, BLOB_SCAN_VERDICTS.CLEAN);

      expect(await store.stat(hash)).toMatchObject({
        integrityState: BLOB_INTEGRITY_STATES.CORRUPT,
        scanVerdict: BLOB_SCAN_VERDICTS.CLEAN,
      });
    });

    it('records an integrity state without disturbing the verdict', async () => {
      const hash = await admit();
      await recordVerdict(hash, BLOB_SCAN_VERDICTS.INFECTED);

      await store.recordIntegrityState(hash, BLOB_INTEGRITY_STATES.CORRUPT);
      expect(await store.stat(hash)).toMatchObject({
        integrityState: BLOB_INTEGRITY_STATES.CORRUPT,
        scanVerdict: BLOB_SCAN_VERDICTS.INFECTED,
      });

      // Bytes that verify again say nothing about what they contain: the blob is
      // still the malware it was found to be.
      await store.recordIntegrityState(hash, BLOB_INTEGRITY_STATES.VERIFIED);
      expect(await store.stat(hash)).toMatchObject({
        integrityState: BLOB_INTEGRITY_STATES.VERIFIED,
        scanVerdict: BLOB_SCAN_VERDICTS.INFECTED,
      });
    });

    it('records the scanner and signatures behind a verdict, so it can be aged', async () => {
      const hash = await admit();

      await recordVerdict(hash, BLOB_SCAN_VERDICTS.CLEAN);

      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.scannerVersion).toBe(SCANNER_VERSION);
      expect(blob.signatureVersion).toBe(SIGNATURE_VERSION);
      expect(blob.scannedAt).toBeInstanceOf(Date);
    });
  });
});
