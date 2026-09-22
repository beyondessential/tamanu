import { log } from '@tamanu/shared/services/logging';

// spec: AV
// What a facility does when its own scanner finds malware. The deployment-wide
// quarantine record names the hash rather than any copy of it and is central's
// to write, reaching this server by sync; a facility's own finding only stops
// it serving the content locally.
export async function onBlobInfected(blobStore, hash) {
  log.warn('BlobScanner: infected content held by this facility', { hash });
  // spec: FEC — quarantined content is never served and never repaired.
  await blobStore.discardParity(hash);
}
