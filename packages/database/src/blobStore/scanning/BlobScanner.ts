import { Op } from 'sequelize';

import { BLOB_INTEGRITY_STATES, BLOB_SCAN_VERDICTS } from '@tamanu/constants';

import type { BlobStore } from '../BlobStore';
import type { Blob } from '../../models/Blob';
import { BlobScannerUnavailableError, type BlobScannerDriver, type ScannerVersions } from './types';

export interface BlobScanPassLimits {
  maxBlobs: number;
  /** The last blob may take it past. */
  maxBytes: number;
  /** Left unscanned rather than sent. */
  maxScanBytes: number;
}

export interface BlobScanResult {
  scanned: number;
  clean: number;
  infected: number;
  bytesScanned: number;
  ratelimited: boolean;
  unavailable: boolean;
}

export interface BlobScannerOptions {
  blobStore: BlobStore;
  models: { Blob: typeof Blob };
  driver: BlobScannerDriver;
  getLimits: () => Promise<BlobScanPassLimits>;
  onInfected: (hash: string, versions: ScannerVersions) => Promise<void>;
  log: {
    info: (message: string, meta?: object) => void;
    warn: (message: string, meta?: object) => void;
  };
}

// spec: AV
// Admission never waits on this. Quarantine is the server's, through onInfected, since the
// deployment-wide record is central's to write.
export class BlobScanner {
  #blobStore: BlobStore;
  #models: { Blob: typeof Blob };
  #driver: BlobScannerDriver;
  #getLimits: () => Promise<BlobScanPassLimits>;
  #onInfected: (hash: string, versions: ScannerVersions) => Promise<void>;
  #log: BlobScannerOptions['log'];

  constructor({ blobStore, models, driver, getLimits, onInfected, log }: BlobScannerOptions) {
    this.#blobStore = blobStore;
    this.#models = models;
    this.#driver = driver;
    this.#getLimits = getLimits;
    this.#onInfected = onInfected;
    this.#log = log;
  }

  async run(): Promise<BlobScanResult> {
    const result: BlobScanResult = {
      scanned: 0,
      clean: 0,
      infected: 0,
      bytesScanned: 0,
      ratelimited: false,
      unavailable: false,
    };

    let versions: ScannerVersions;
    try {
      versions = await this.#driver.versions();
    } catch (error) {
      // Nothing is retried here: the next pass tries again.
      this.#log.warn('BlobScanner: scanner unavailable, pass skipped', {
        error: (error as Error).message,
      });
      return { ...result, unavailable: true };
    }

    const limits = await this.#getLimits();
    for (const blob of await this.#candidates(limits, versions)) {
      if (result.bytesScanned >= limits.maxBytes) {
        result.ratelimited = true;
        break;
      }
      if (!(await this.#scanOne(blob, versions, result))) {
        result.unavailable = true;
        break;
      }
    }

    this.#log.info('BlobScanner: pass complete', { ...result, ...versions });
    return result;
  }

  // spec: AV
  // A verdict under older signatures is due again, which makes a signature update a re-scan of the
  // store. Oversized blobs are left out of the query so they can't starve the head of the queue.
  async #candidates(limits: BlobScanPassLimits, versions: ScannerVersions): Promise<Blob[]> {
    return await this.#models.Blob.findAll({
      where: {
        integrityState: BLOB_INTEGRITY_STATES.VERIFIED,
        size: { [Op.lte]: limits.maxScanBytes },
        [Op.or]: [
          { scanVerdict: null },
          {
            scanVerdict: BLOB_SCAN_VERDICTS.CLEAN,
            signatureVersion: { [Op.ne]: versions.signatureVersion },
          },
        ],
      },
      order: [
        ['scannedAt', 'ASC NULLS FIRST'],
        ['createdAt', 'ASC'],
      ],
      limit: limits.maxBlobs,
    });
  }

  async #scanOne(blob: Blob, versions: ScannerVersions, result: BlobScanResult): Promise<boolean> {
    const { hash, size } = blob;
    try {
      const verdict = await this.#driver.scan({
        hash,
        size,
        // spec: SCRUB
        // Verification is the scrub's job, so mid-pass corruption doesn't abort the scan of the
        // rest.
        open: () => this.#blobStore.get(hash, { verify: false }),
      });
      if (verdict === BLOB_SCAN_VERDICTS.INFECTED) {
        this.#log.warn('BlobScanner: infected content found', { hash, ...versions });
        // Quarantined before the terminal verdict, so a failed quarantine write leaves the blob to
        // be found again.
        await this.#onInfected(hash, versions);
        result.infected += 1;
      } else {
        result.clean += 1;
      }
      await this.#blobStore.recordScanVerdict(hash, { verdict, ...versions });
      result.scanned += 1;
      result.bytesScanned += size;
      return true;
    } catch (error) {
      if (error instanceof BlobScannerUnavailableError) {
        this.#log.warn('BlobScanner: scanner unavailable, pass ended early', {
          hash,
          error: error.message,
        });
        return false;
      }
      // Deleted or evicted since the query; carry on with the rest.
      this.#log.warn('BlobScanner: could not scan a blob', { hash, error: (error as Error).message });
      return true;
    }
  }
}
