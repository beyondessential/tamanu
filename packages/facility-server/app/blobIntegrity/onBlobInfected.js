import { log } from '@tamanu/shared/services/logging';

// spec: AV
// The deployment-wide quarantine is central's to write; a local finding only stops local serving.
export async function onBlobInfected(blobStore, hash) {
  log.warn('BlobScanner: infected content held by this facility', { hash });
  // spec: FEC
  await blobStore.discardParity(hash);
}
