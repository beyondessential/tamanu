import { Op } from 'sequelize';

import { BLOB_INTEGRITY_STATES, BLOB_SCAN_VERDICTS } from '@tamanu/constants';

import type { BlobStore } from '../BlobStore';
import type { Blob } from '../../models/Blob';
import { BlobScannerUnavailableError, type BlobScannerDriver, type ScannerVersions } from './types';

export interface BlobScanPassLimits {
  /** Blobs sent to the scanner in one pass. */
  maxBlobs: number;
  /** Bytes sent to the scanner in one pass; the last blob may take it past. */
  maxBytes: number;
  /** Blobs larger than this are left unscanned rather than sent. */
  maxScanBytes: number;
}

export interface BlobScanResult {
  scanned: number;
  clean: number;
  infected: number;
  bytesScanned: number;
  /** True when the pass stopped on a limit rather than exhausting its work. */
  ratelimited: boolean;
  /** True when the pass stopped because the scanner could not be reached. */
  unavailable: boolean;
}

export interface BlobScannerOptions {
  blobStore: BlobStore;
  models: { Blob: typeof Blob };
  driver: BlobScannerDriver;
  getLimits: () => Promise<BlobScanPassLimits>;
  /**
   * Quarantine and propagation, supplied by the server: what a server does with
   * an infected hash beyond recording it differs between the authoritative
   * store and a facility serving on central's verdict.
   */
  onInfected: (hash: string, versions: ScannerVersions) => Promise<void>;
  log: {
    info: (message: string, meta?: object) => void;
    warn: (message: string, meta?: object) => void;
  };
}

// spec: AV
// The scheduled antivirus pass: send stored blobs to the host scanner and
// record what it found. Admission never waits on this, so the pass carries both
// the first scan of newly admitted content and the re-scan of content whose
// verdict predates the scanner's current signatures.
//
// Detection only. Quarantining an infected hash and propagating it are the
// server's, through onInfected, because the deployment-wide record is central's
// to write.
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
      // Nothing is recorded and nothing is retried here: the next pass tries
      // again, and until it succeeds the content stays unscanned.
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
  // Never-scanned blobs first, then those scanned longest ago. A blob scanned
  // clean under signatures the scanner has since moved past is due again, which
  // is what makes a signature update a re-scan of the store rather than an
  // event the pass has to be told about.
  //
  // Infected blobs are not re-scanned: the verdict is terminal, the content is
  // quarantined, and a later signature set has nothing to add. Corrupt and
  // absent blobs are skipped too, having no servable bytes to have a verdict
  // about. Blobs over the size cap are left out of the scan entirely rather
  // than picked up and skipped, so they cannot occupy the head of the queue
  // pass after pass and starve content the scanner can take.
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

  /** False when the scanner went away, which ends the pass. */
  async #scanOne(blob: Blob, versions: ScannerVersions, result: BlobScanResult): Promise<boolean> {
    const { hash, size } = blob;
    try {
      const verdict = await this.#driver.scan({
        hash,
        size,
        // spec: SCRUB — verification is the scrub's job and its own budget. A
        // scan reads the bytes as they are, so corruption arriving mid-pass
        // does not abort the scan of everything queued behind it.
        open: () => this.#blobStore.get(hash, { verify: false }),
      });
      if (verdict === BLOB_SCAN_VERDICTS.INFECTED) {
        this.#log.warn('BlobScanner: infected content found', { hash, ...versions });
        // Quarantined before the verdict is recorded, which is terminal and
        // takes the blob out of every later pass: a quarantine that fails to
        // write leaves the blob to be found again rather than confining a known
        // infection to this server.
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
      // One unreadable blob (deleted or evicted since the query) is not a
      // reason to abandon the rest of the pass.
      this.#log.warn('BlobScanner: could not scan a blob', { hash, error: (error as Error).message });
      return true;
    }
  }
}
