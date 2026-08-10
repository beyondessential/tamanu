import { blobWithholdReason } from '@tamanu/database/blobStore';
import { BLOB_SCANNERS } from '@tamanu/constants';

// spec: AV
/**
 * Whether this server will serve a blob it holds, given the deployment's serve
 * policy and what is known about the content. Every read path asks this, so a
 * posture change lands everywhere at once rather than route by route.
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

// spec: AV
/**
 * Record content as known bad, deployment-wide. Written on central alone and
 * pulled everywhere, so a facility or device that runs no scanner still refuses
 * the content. Keyed by hash and never removed by a later arrival of the same
 * content: the hash names the same malware whichever copy turns up.
 */
export async function quarantineBlob(models, hash, { scannerVersion, signatureVersion }) {
  const [record] = await models.BlobQuarantine.findOrCreate({
    where: { hash },
    defaults: { hash, scannerVersion, signatureVersion },
  });
  return record;
}
