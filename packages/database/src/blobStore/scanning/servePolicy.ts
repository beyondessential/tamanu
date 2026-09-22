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
 * Off records this server's verdicts without acting on them, which is what lets
 * a deployment bed scanning in and watch what it flags before a false positive
 * can take a clinical file offline. A quarantine is not one of those verdicts:
 * it is the deployment's standing record of confirmed malware, and it binds
 * under every posture.
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
  // A quarantine binds whatever the posture. Off governs whether this server
  // acts on its own verdicts; it does not license serving content the
  // deployment has already recorded as malware.
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
