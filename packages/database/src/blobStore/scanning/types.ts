import type { Readable } from 'node:stream';

import type { BlobScanVerdict } from '@tamanu/constants';

// spec: AV
// Raised when the scanner cannot be reached, times out, or answers something
// that is not a verdict. It is deliberately distinct from an infected verdict:
// a scanner that is down leaves content unscanned, and what an unscanned blob
// does is the serve policy's decision, so an outage never widens what is
// served and never fails an upload.
export class BlobScannerUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'BlobScannerUnavailableError';
  }
}

export interface ScannerVersions {
  /** The scanning engine's own version, e.g. `ClamAV 1.0.5`. */
  scannerVersion: string;
  /** The malware signature version the engine currently holds, e.g. `27100`. */
  signatureVersion: string;
}

export interface BlobScanTarget {
  hash: string;
  size: number;
  /** The blob's bytes. Opened only when the scanner needs them streamed. */
  open: () => Promise<Readable>;
}

// spec: AV
// One interface over the host scanners Tamanu can drive. Each driver owns how
// it reaches its scanner and how it reads a verdict back; everything above
// this line is scanner-agnostic.
export interface BlobScannerDriver {
  /**
   * The engine and signature versions in force now. Read once per pass: it is
   * how a signature update is noticed, since a blob whose recorded signature
   * version is behind this one is due for a re-scan.
   */
  versions: () => Promise<ScannerVersions>;
  scan: (target: BlobScanTarget) => Promise<BlobScanVerdict>;
}
