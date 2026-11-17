import type { Readable } from 'node:stream';

import type { BlobScanVerdict } from '@tamanu/constants';

// spec: AV
// Distinct from an infected verdict: an outage leaves content unscanned, so it never widens what's
// served or fails an upload.
export class BlobScannerUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'BlobScannerUnavailableError';
  }
}

export interface ScannerVersions {
  /** e.g. `ClamAV 1.0.5`. */
  scannerVersion: string;
  /** e.g. `27100`. */
  signatureVersion: string;
}

export interface BlobScanTarget {
  hash: string;
  size: number;
  open: () => Promise<Readable>;
}

// spec: AV
export interface BlobScannerDriver {
  /** Read once per pass: a recorded signature version behind this one is due for a re-scan. */
  versions: () => Promise<ScannerVersions>;
  scan: (target: BlobScanTarget) => Promise<BlobScanVerdict>;
}
