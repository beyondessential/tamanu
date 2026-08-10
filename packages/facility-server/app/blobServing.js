import { BLOB_SCANNERS } from '@tamanu/constants';
import { blobWithholdReason } from '@tamanu/database/blobStore';

// spec: AV
/**
 * Whether this facility will serve a blob it holds. The quarantine record is
 * pulled from central, so this answers the same way with the link down as with
 * it up: a facility that has already cached known-bad content still refuses it.
 *
 * Returns the availability state to answer with, or null when the blob serves.
 */
export async function blobServeGate({ settings, models }, hash, stat) {
  const { servePolicy, scanner } = await settings.get('blobStorage.antivirus');
  const quarantined = Boolean(await models.BlobQuarantine.findOne({ where: { hash } }));
  return blobWithholdReason({
    scanVerdict: stat?.scanVerdict ?? null,
    quarantined,
    policy: servePolicy,
    scans: scanner !== BLOB_SCANNERS.NONE,
  });
}
