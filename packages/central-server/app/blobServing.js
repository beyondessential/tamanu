import { blobWithholdReason } from '@tamanu/database/blobStore';
import { BLOB_SCANNERS } from '@tamanu/constants';

// spec: AV
/**
 * Every read path asks this, so a posture change lands everywhere at once. Returns the availability
 * to answer with, or null when it serves.
 */
export async function blobServeGate({ settings, models }, hash, stat) {
  const { servePolicy, scanner } = await settings.get('blobStorage.antivirus');
  const quarantined = Boolean(await models.BlobQuarantine.findOne({ where: { hash } }));
  return blobWithholdReason({
    scanVerdict: stat?.scanVerdict ?? null,
    quarantined,
    policy: servePolicy,
    // The quarantine still applies to unheld content: it names the hash, not a copy.
    scans: Boolean(stat) && scanner !== BLOB_SCANNERS.NONE,
  });
}

// spec: AV
/**
 * Pulled everywhere, so a scanner-less facility or device still refuses it. Never removed by a
 * later copy: the hash names the same malware.
 */
export async function quarantineBlob(models, hash, { scannerVersion, signatureVersion }) {
  const [record] = await models.BlobQuarantine.findOrCreate({
    where: { hash },
    defaults: { hash, scannerVersion, signatureVersion },
  });
  return record;
}
