import {
  BLOB_AVAILABILITY_STATES,
  BLOB_SCAN_VERDICTS,
  BLOB_SERVE_POLICIES,
  type BlobAvailabilityState,
  type BlobScanVerdict,
  type BlobServePolicy,
} from '@tamanu/constants';

export interface ServeDecisionInput {
  /** What this server's own scan found, or null when it has not scanned it. */
  scanVerdict: BlobScanVerdict | null;
  /** Whether the hash carries a deployment-wide known-bad record. */
  quarantined: boolean;
  policy: BlobServePolicy;
  /** Whether this server drives a scanner of its own. */
  scans: boolean;
}

// spec: AV
/**
 * Why a blob this server holds is not being served, or null when it serves.
 *
 * Off records verdicts without acting on them, which is what lets a deployment
 * bed scanning in and watch what it flags before a false positive can take a
 * clinical file offline.
 *
 * Serve-only-when-known-good binds only where this server scans. A server
 * without a scanner of its own holds no verdicts, so the posture would withhold
 * everything it has; falling back to serve-unless-known-bad is what "a facility
 * without its own scanner uses the central verdict" means in practice, since
 * central's known-bad records are what reached it.
 */
export function blobWithholdReason({
  scanVerdict,
  quarantined,
  policy,
  scans,
}: ServeDecisionInput): BlobAvailabilityState | null {
  if (policy === BLOB_SERVE_POLICIES.OFF) {
    return null;
  }
  if (quarantined || scanVerdict === BLOB_SCAN_VERDICTS.INFECTED) {
    return BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED;
  }
  if (policy === BLOB_SERVE_POLICIES.ONLY_KNOWN_GOOD && scans) {
    return scanVerdict === BLOB_SCAN_VERDICTS.CLEAN
      ? null
      : BLOB_AVAILABILITY_STATES.AWAITING_SCAN;
  }
  return null;
}
