import { findOrphanedBlobHashes } from './blobReferences';

// spec: RECL
/**
 * Central's orphan collection: remove blobs nothing references and nothing has
 * referenced. Central only, because a facility's store is a cache whose outbox
 * holds the only durable copy of its content; a facility reclaims space by
 * evicting cached blobs instead.
 *
 * Orphans arise from anomalies (an interrupted upload, a reference repointed at
 * new content), so a pass normally finds nothing. Both bounds are there to make
 * doing too little the failure mode: a pass takes a capped number of orphans and
 * stops once it has freed its byte budget, so a liveness query that ever went
 * wrong takes a bounded amount of content before an operator sees it.
 */
export class BlobReclaimer {
  #sequelize;
  #blobStore;
  #getLimits;
  #log;

  constructor({ sequelize, blobStore, getLimits, log }) {
    this.#sequelize = sequelize;
    this.#blobStore = blobStore;
    this.#getLimits = getLimits;
    this.#log = log;
  }

  async run() {
    const { maxBlobs, maxBytes, safetyWindowMs } = await this.#getLimits();
    const orphans = await findOrphanedBlobHashes(this.#sequelize, {
      limit: maxBlobs,
      admittedBefore: new Date(Date.now() - safetyWindowMs),
    });

    const result = { found: orphans.length, collected: 0, bytesReclaimed: 0, ratelimited: false };
    for (const { hash, size } of orphans) {
      if (result.bytesReclaimed >= maxBytes) {
        result.ratelimited = true;
        break;
      }
      try {
        await this.#blobStore.delete(hash);
        result.collected += 1;
        result.bytesReclaimed += size;
      } catch (error) {
        // One blob that will not delete must not end the pass; it is still an
        // orphan next time.
        this.#log.warn('BlobReclaimer: collection failed, skipping', {
          hash,
          error: error.message,
        });
      }
    }
    result.ratelimited ||= orphans.length === maxBlobs;

    if (result.collected > 0 || result.ratelimited) {
      this.#log.info('BlobReclaimer: collected orphaned blobs', { ...result });
    }
    return result;
  }
}
