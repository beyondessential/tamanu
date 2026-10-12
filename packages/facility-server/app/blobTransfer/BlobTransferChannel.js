import { Readable } from 'node:stream';

import { BlobTransfer, blobEndpoints, rangeHeader, totalSizeFromHeaders } from '@tamanu/blobs';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

// spec: XFER
// The decisions live in @tamanu/blobs so mobile runs the same state machines; this is the server's
// host for them.
export class BlobTransferChannel {
  #blobStore;
  #centralServer;
  #facilityIds;
  #transfer;

  // spec: BLAC
  // Declared on every request so central scopes blob access as it scopes this server's record sync.
  constructor({ blobStore, centralServer, facilityIds, pushChunkBytes }) {
    // Fail at boot rather than as a forbidden response on the first transfer: central refuses a
    // caller declaring no facilities.
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

  async availability(hash, { stat } = {}) {
    return await this.#transfer.availability(hash, { stat });
  }

  async open(hash, { start, end } = {}) {
    let stat = await this.#blobStore.servableStat(hash);
    if (!stat) {
      await this.fetchFromCentral(hash);
      stat = await this.#blobStore.servableStat(hash);
    }
    return await this.#blobStore.get(hash, { start, end, stat });
  }

  // spec: SCRUB
  /**
   * A copy the store won't serve doesn't count as held, so it's refetched; the bad bytes go once
   * the replacement verifies.
   */
  async fetchFromCentral(hash) {
    return await this.#transfer.fetch(hash);
  }

  /**
   * Central acknowledges only once it has verified and durably stored the content, so the local
   * copy is then evictable.
   */
  async pushToCentral(hash) {
    return await this.#transfer.push(hash);
  }

  #host() {
    const blobStore = this.#blobStore;
    return {
      // spec: SCRUB
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
      // Three-argument api-client form: the second argument is the query, the third the request
      // config.
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

  // Per chunk rather than one handle held across the push: an open handle blocks delete on Windows.
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
