import { BLOB_SCANNERS, type BlobScanner as BlobScannerName } from '@tamanu/constants';

import { ClamdScanner } from './ClamdScanner';
import type { BlobScannerDriver } from './types';

export interface ScannerConfig {
  scanner: BlobScannerName;
  address: string;
  timeoutMs: number;
}

// spec: AV
/** Null when unconfigured, which is the whole of the no-op: no pass, no verdicts. */
export function createScannerDriver({
  scanner,
  address,
  timeoutMs,
}: ScannerConfig): BlobScannerDriver | null {
  switch (scanner) {
    case BLOB_SCANNERS.CLAMD:
      return new ClamdScanner({ address, timeoutMs });
    default:
      return null;
  }
}
