import { BLOB_SCANNERS, type BlobScanner as BlobScannerName } from '@tamanu/constants';

import { ClamdScanner } from './ClamdScanner';
import type { BlobScannerDriver } from './types';

export interface ScannerConfig {
  scanner: BlobScannerName;
  address: string;
  timeoutMs: number;
}

// spec: AV
/**
 * The driver for a server's configured scanner, or null where none is
 * configured. Null is the whole of "no-op when unconfigured": no driver means
 * no scan pass, no verdicts, and a serve policy with nothing to act on.
 */
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
