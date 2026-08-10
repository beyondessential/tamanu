import { Readable } from 'node:stream';

import { BlobTransfer, blobEndpoints, rangeHeader, totalSizeFromHeaders } from '@tamanu/blobs';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

// spec: XFER
// The facility side of the blob transfer channel: availability (with the
// awaiting-upload/awaiting-fetch distinction), resumable fetch from central,
// resumable chunked push to central, and a read-through open that serves local
// bytes or fetches them on demand — the general form of the
// try-local-then-central pattern.
//
// The decisions live in @tamanu/blobs so mobile runs the same state machines;
// this class is the server's host for them, holding the api-client conventions
// and the node IO.
export class BlobTransferChannel {
  #blobStore;
  #centralServer;
  #facilityIds;
  #transfer;

  // spec: BLAC
  // facilityIds is the store's own server facilities (getServerFacilityIds),
  // declared to central on every request so it scopes blob access exactly as it
  // scopes record sync for this server. Without it central cannot tell which
  // facility the request acts for and would have to fall back on the sync
  // user's whole entitlement.
  constructor({ blobStore, centralServer, facilityIds, pushChunkBytes }) {
    // Central refuses a caller that declares no facilities, so an omitted list
    // fails every fetch and push. Rejecting it here surfaces the misconfiguration
    // at boot rather than as a forbidden response on the first transfer.
    if (!facilityIds?.length) {
      throw new Error('BlobTransferChannel requires the server facility ids');
    }
    this.#blobStore = blobStore;
    this.#centralServer = centralServer;
    this.#facilityIds = facilityIds;
    this.#transfer = new BlobTransfer(this.#host(), { pushChunkBytes });
  }

  async has(hash) {
    return await this.#blobStore.has(hash);
  }

  async availability(hash) {
    return await this.#transfer.availability(hash);
  }

  /**
   * Read-through: stream the blob's bytes, fetching them from the central
   * server first when they are not held locally.
   */
  async open(hash, { start, end } = {}) {
    let stat = await this.#blobStore.servableStat(hash);
    if (!stat) {
      await this.fetchFromCentral(hash);
      stat = await this.#blobStore.servableStat(hash);
    }
    // Pass the stat so get does not re-query the registry for the same hash.
    return await this.#blobStore.get(hash, { start, end, stat });
  }

  /**
   * Fetch a blob's bytes from the central server into the local store.
   * Idempotent: content already held skips the transfer. An interrupted
   * download resumes from the bytes already staged, including across calls
   * and restarts, and the complete content is verified against the hash
   * before it is admitted.
   *
   * spec: SCRUB — a copy the store will not serve does not count as held, so a
   * hash occupied by one is fetched rather than skipped; the bad bytes are only
   * dropped once the replacement has verified.
   */
  async fetchFromCentral(hash) {
    return await this.#transfer.fetch(hash);
  }

  /**
   * Deliver a locally held blob's bytes to the central server. Idempotent:
   * content central already holds is acknowledged without transfer. The
   * acknowledgement arrives only once central has verified and durably stored
   * the content, so the caller may treat the local copy as evictable. An
   * interrupted push resumes from the bytes central has already staged.
   */
  async pushToCentral(hash) {
    return await this.#transfer.push(hash);
  }

  #host() {
    const blobStore = this.#blobStore;
    return {
      // spec: SCRUB — bytes the store will not serve are not held for transfer
      // either: a quarantined copy is what an incoming good copy replaces, and
      // is not deliverable to central.
      stat: hash => blobStore.servableStat(hash),
      stagedSize: hash => blobStore.stagedSize(hash),
      commitStaged: hash => blobStore.commitStaged(hash),
      remoteAvailability: hash => this.#remoteAvailability(hash),
      fetchInto: (hash, { offset }) => this.#fetchInto(hash, offset),
      offer: (hash, { size }) => this.#offer(hash, size),
      pushChunk: (hash, options) => this.#pushChunk(hash, options),
      sleep: sleepAsync,
      onStall: details => log.debug('BlobTransferChannel: interrupted, resuming', details),
    };
  }

  async #remoteAvailability(hash) {
    return await this.#centralServer.fetch(blobEndpoints.availability(hash), {
      query: { facilityIds: this.#facilityIds },
    });
  }

  async #fetchInto(hash, offset) {
    const response = await this.#centralServer.fetch(
      // Three-argument api-client form: the second positional argument is
      // the query (facilityIds go through as query params), the third is
      // the request config. See CentralServerConnection.fetch.
      blobEndpoints.content(hash),
      { facilityIds: this.#facilityIds },
      {
        returnResponse: true,
        retryAuth: true,
        headers: rangeHeader(offset),
      },
    );
    const totalSize = totalSizeFromHeaders({
      contentRange: response.headers.get('content-range'),
      contentLength: response.headers.get('content-length'),
      offset,
    });
    const body = response.body ? Readable.fromWeb(response.body) : Readable.from([]);
    await this.#blobStore.stage(hash, body, { offset });
    return { totalSize };
  }

  async #offer(hash, size) {
    return await this.#centralServer.fetch(blobEndpoints.offer(hash), {
      method: 'POST',
      query: { facilityIds: this.#facilityIds },
      body: { size },
    });
  }

  async #pushChunk(hash, { offset, length, totalSize }) {
    return await this.#centralServer.fetch(blobEndpoints.upload(hash), {
      method: 'PUT',
      query: { offset, totalSize, facilityIds: this.#facilityIds },
      body: await this.#readChunk(hash, offset, length),
      headers: { 'content-type': 'application/octet-stream' },
    });
  }

  async #readChunk(hash, offset, length) {
    if (length === 0) {
      return Buffer.alloc(0);
    }
    // fs read streams take an inclusive end.
    const stream = await this.#blobStore.get(hash, { start: offset, end: offset + length - 1 });
    const pieces = [];
    for await (const piece of stream) {
      pieces.push(piece);
    }
    return Buffer.concat(pieces);
  }
}
