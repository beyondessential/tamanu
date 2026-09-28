import {
  BLOB_AVAILABILITY_STATES,
  BLOB_SCAN_VERDICTS,
  BLOB_SERVE_POLICIES,
  type BlobAvailabilityState,
  type BlobScanVerdict,
  type BlobServePolicy,
} from '@tamanu/constants';

export interface ServeDecisionInput {
  scanVerdict: BlobScanVerdict | null;
  quarantined: boolean;
  policy: BlobServePolicy;
  scans: boolean;
}

// spec: AV
/**
 * Off records verdicts without acting on them, so a deployment can bed scanning in before a false
 * positive takes a file offline. Serve-only-when-known-good binds only where this server scans;
 * elsewhere it falls back to serve-unless-known-bad on central's records.
 */
export function blobWithholdReason({
  scanVerdict,
  quarantined,
  policy,
  scans,
}: ServeDecisionInput): BlobAvailabilityState | null {
  // A quarantine binds whatever the posture.
  if (quarantined) {
    return BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED;
  }
  if (policy === BLOB_SERVE_POLICIES.OFF) {
    return null;
  }
  if (scanVerdict === BLOB_SCAN_VERDICTS.INFECTED) {
    return BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED;
  }
  if (policy === BLOB_SERVE_POLICIES.ONLY_KNOWN_GOOD && scans) {
    return scanVerdict === BLOB_SCAN_VERDICTS.CLEAN
      ? null
      : BLOB_AVAILABILITY_STATES.AWAITING_SCAN;
  }
  return null;
}
