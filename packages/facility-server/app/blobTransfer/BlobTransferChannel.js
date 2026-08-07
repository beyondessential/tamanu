import { Readable } from 'node:stream';

import { BLOB_AVAILABILITY_STATES, BLOB_OFFER_STATUSES } from '@tamanu/constants';
import { ERROR_TYPE, NotFoundError, RemoteCallError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

// Bytes per push request. Bounded so a large blob is never held in memory
// whole, while each request stays big enough that per-request overhead doesn't
// dominate. Many small blobs parallelise as concurrent requests over the
// multiplexed facility-central connection instead of batching.
const PUSH_CHUNK_BYTES = 8 * 1024 * 1024;

// Consecutive attempts that deliver no new bytes before a transfer gives up.
// Attempts that make progress don't count: a transfer that keeps inching
// forward over a poor link is working as intended.
const STALLED_ATTEMPTS = 5;
const RETRY_BASE_MS = 500;

// spec: XFER
// The facility side of the blob transfer channel: availability (with the
// awaiting-upload/awaiting-fetch distinction), resumable fetch from central,
// resumable chunked push to central, and a read-through open that serves local
// bytes or fetches them on demand — the general form of the
// try-local-then-central pattern.
//
// This is the primitive layer: it moves one blob per call and resumes across
// interruptions within the call. Scheduling — background pushing, retry over
// hours, eviction — belongs to the cache tier above it (see
// specs/blob-storage/facility-cache.md).
export class BlobTransferChannel {
  #blobStore;
  #centralServer;
  #pushChunkBytes;
  #facilityIds;

  // spec: BLAC
  // facilityIds is the store's own server facilities (getServerFacilityIds),
  // declared to central on every request so it scopes blob access exactly as it
  // scopes record sync for this server. Without it central cannot tell which
  // facility the request acts for and would have to fall back on the sync
  // user's whole entitlement.
  constructor({ blobStore, centralServer, facilityIds = [], pushChunkBytes = PUSH_CHUNK_BYTES }) {
    this.#blobStore = blobStore;
    this.#centralServer = centralServer;
    this.#facilityIds = facilityIds;
    this.#pushChunkBytes = pushChunkBytes;
  }

  async has(hash) {
    return await this.#blobStore.has(hash);
  }

  // spec: XFER
  // Availability of a referenced hash as served from here: bytes held locally
  // are available; bytes central holds are awaiting our fetch; bytes central
  // lacks are awaiting upload from their origin.
  async availability(hash) {
    const local = await this.#blobStore.stat(hash);
    if (local) {
      return { availability: BLOB_AVAILABILITY_STATES.AVAILABLE, size: local.size };
    }
    const central = await this.#centralServer.fetch(
      `blob/${encodeURIComponent(hash)}/availability`,
      { query: { facilityIds: this.#facilityIds } },
    );
    if (central.availability === BLOB_AVAILABILITY_STATES.AVAILABLE) {
      return { availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH, size: central.size };
    }
    return { availability: central.availability };
  }

  /**
   * Read-through: stream the blob's bytes, fetching them from the central
   * server first when they are not held locally.
   */
  async open(hash, { start, end } = {}) {
    let stat = await this.#blobStore.stat(hash);
    if (!stat) {
      await this.fetchFromCentral(hash);
      stat = await this.#blobStore.stat(hash);
    }
    // Pass the stat so get does not re-query the registry for the same hash.
    return await this.#blobStore.get(hash, { start, end, stat });
  }

  // spec: XFER
  /**
   * Fetch a blob's bytes from the central server into the local store.
   * Idempotent: content already held skips the transfer. An interrupted
   * download resumes from the bytes already staged, including across calls
   * and restarts, and the complete content is verified against the hash
   * before it is admitted.
   *
   * spec: SCRUB — `ignoreLocal` fetches even though the hash is occupied, for
   * the self-heal path replacing a copy that failed verification. The bad bytes
   * are only dropped once the replacement has verified.
   */
  async fetchFromCentral(hash, { ignoreLocal = false } = {}) {
    const held = ignoreLocal ? null : await this.#blobStore.stat(hash);
    if (held) {
      return { hash, size: held.size, existed: true };
    }

    // The size central holds for this hash, once learned (from a resume probe
    // or a response). Staged bytes covering it mean only verification is left
    // — including when a previous call was interrupted between staging the
    // final byte and committing, where re-requesting from that offset would
    // only ever earn a range-not-satisfiable refusal.
    let knownSize;
    if ((await this.#blobStore.stagedSize(hash)) > 0) {
      const central = await this.#centralServer.fetch(
        `blob/${encodeURIComponent(hash)}/availability`,
      );
      if (central.availability === BLOB_AVAILABILITY_STATES.AVAILABLE) {
        knownSize = central.size;
      }
    }

    let stalledAttempts = 0;
    for (;;) {
      const offset = await this.#blobStore.stagedSize(hash);
      if (knownSize !== undefined && offset >= knownSize) {
        // Everything is staged; commit verifies it. Over-staged content fails
        // verification there and is discarded, so the next call starts clean.
        break;
      }
      try {
        const response = await this.#centralServer.fetch(
          // Three-argument api-client form: the second positional argument is
          // the query (facilityIds go through as query params), the third is
          // the request config. See CentralServerConnection.fetch.
          `blob/${encodeURIComponent(hash)}`,
          { facilityIds: this.#facilityIds },
          {
            returnResponse: true,
            retryAuth: true,
            headers: offset > 0 ? { range: `bytes=${offset}-` } : {},
          },
        );
        knownSize = totalSizeFromResponse(response, offset) ?? knownSize;
        const body = response.body ? Readable.fromWeb(response.body) : Readable.from([]);
        await this.#blobStore.stage(hash, body, { offset });
      } catch (error) {
        if (error?.type === ERROR_TYPE.NOT_FOUND) {
          // Central doesn't hold the bytes: content-pending at the source,
          // not a transfer fault. Nothing to resume.
          throw error;
        }
        const staged = await this.#blobStore.stagedSize(hash);
        stalledAttempts = staged > offset ? 0 : stalledAttempts + 1;
        if (stalledAttempts >= STALLED_ATTEMPTS) {
          throw error;
        }
        log.debug('BlobTransferChannel.fetchFromCentral: interrupted, resuming', {
          hash,
          staged,
          stalledAttempts,
        });
        await sleepAsync(RETRY_BASE_MS * stalledAttempts);
        continue;
      }

      const staged = await this.#blobStore.stagedSize(hash);
      if (knownSize !== undefined && staged < knownSize) {
        // The stream ended early without erroring; go around for the rest,
        // backing off the same as the error path so a peer that keeps returning
        // truncated bodies is paced rather than hammered.
        stalledAttempts = staged > offset ? 0 : stalledAttempts + 1;
        if (stalledAttempts >= STALLED_ATTEMPTS) {
          throw new RemoteCallError(`Fetch of ${hash} stalled at ${staged} of ${knownSize} bytes`);
        }
        await sleepAsync(RETRY_BASE_MS * stalledAttempts);
        continue;
      }
      break;
    }

    // Verifies the complete content, including bytes staged before any
    // interruption; a mismatch discards the staging so the next attempt
    // starts clean.
    return await this.#blobStore.commitStaged(hash);
  }

  // spec: XFER
  /**
   * Deliver a locally held blob's bytes to the central server. Idempotent:
   * content central already holds is acknowledged without transfer. The
   * acknowledgement arrives only once central has verified and durably stored
   * the content, so the caller may treat the local copy as evictable. An
   * interrupted push resumes from the bytes central has already staged.
   */
  async pushToCentral(hash) {
    const held = await this.#blobStore.stat(hash);
    if (!held) {
      throw new NotFoundError(`Cannot push a blob not held locally: ${hash}`);
    }
    const { size } = held;

    const offer = await this.#offer(hash, size);
    if (offer.status === BLOB_OFFER_STATUSES.ALREADY_STORED) {
      return { acknowledged: true, existed: true };
    }

    let offset = offer.receivedBytes ?? 0;
    let stalledAttempts = 0;
    for (;;) {
      try {
        return await this.#pushFrom(hash, size, offset);
      } catch (error) {
        if (error?.type === ERROR_TYPE.BLOB_HASH_MISMATCH) {
          // Central discarded the staged content: what we sent doesn't match
          // the hash we hold it under. Local integrity's problem, not a
          // transfer retry's (see specs/blob-storage/integrity.md).
          throw error;
        }
        if (error?.type === ERROR_TYPE.FORBIDDEN) {
          // spec: BLAC
          // Central refuses the push: the blob's referencing record hasn't
          // synchronised there yet (or isn't in our scope). Retrying without a
          // sync in between cannot change the answer, so fail the push now and
          // let the pusher move on to the next blob (see
          // specs/blob-storage/facility-cache.md).
          throw error;
        }
        // Learn where central actually got to and resume from there — covers
        // a connection dropped mid-chunk, where central staged part of the
        // body we sent. A re-offer that itself fails is just another transient
        // fault: count it as a stalled attempt and retry from the same offset,
        // rather than letting it abort the push and swallow the original error.
        let reoffer;
        try {
          reoffer = await this.#offer(hash, size);
        } catch {
          stalledAttempts += 1;
          if (stalledAttempts >= STALLED_ATTEMPTS) {
            throw error;
          }
          await sleepAsync(RETRY_BASE_MS * stalledAttempts);
          continue;
        }
        if (reoffer.status === BLOB_OFFER_STATUSES.ALREADY_STORED) {
          return { acknowledged: true, existed: true };
        }
        const serverOffset = reoffer.receivedBytes ?? 0;
        stalledAttempts = serverOffset > offset ? 0 : stalledAttempts + 1;
        if (stalledAttempts >= STALLED_ATTEMPTS) {
          throw error;
        }
        log.debug('BlobTransferChannel.pushToCentral: interrupted, resuming', {
          hash,
          serverOffset,
          stalledAttempts,
        });
        offset = serverOffset;
        await sleepAsync(RETRY_BASE_MS * stalledAttempts);
      }
    }
  }

  async #offer(hash, size) {
    return await this.#centralServer.fetch(`blob/${encodeURIComponent(hash)}/offer`, {
      method: 'POST',
      query: { facilityIds: this.#facilityIds },
      body: { size },
    });
  }

  async #pushFrom(hash, size, startOffset) {
    if (startOffset >= size) {
      // A zero-byte blob, or central already staged every byte (say it
      // restarted before finalising): one empty delivery completes it.
      return await this.#putChunk(hash, Buffer.alloc(0), startOffset, size);
    }

    let offset = startOffset;
    let response;
    let pending = [];
    let pendingBytes = 0;
    const flush = async () => {
      const chunk = Buffer.concat(pending);
      pending = [];
      pendingBytes = 0;
      response = await this.#putChunk(hash, chunk, offset, size);
      offset += chunk.length;
    };

    const stream = await this.#blobStore.get(hash, { start: offset });
    for await (const piece of stream) {
      pending.push(piece);
      pendingBytes += piece.length;
      if (pendingBytes >= this.#pushChunkBytes) {
        await flush();
      }
    }
    if (pendingBytes > 0) {
      await flush();
    }

    if (!response?.acknowledged) {
      // Every byte was delivered but central still expects more: the sizes
      // disagree. Retriable via re-offer, which resets the shared position.
      throw new RemoteCallError(`Push of ${hash} delivered ${offset} bytes without acknowledgement`);
    }
    return response;
  }

  async #putChunk(hash, chunk, offset, totalSize) {
    return await this.#centralServer.fetch(`blob/${encodeURIComponent(hash)}/content`, {
      method: 'PUT',
      query: { offset, totalSize, facilityIds: this.#facilityIds },
      body: chunk,
      headers: { 'content-type': 'application/octet-stream' },
    });
  }
}

function totalSizeFromResponse(response, offset) {
  const contentRange = response.headers.get('content-range');
  const total = contentRange?.match(/^bytes \d+-\d+\/(?<total>\d+)$/)?.groups?.total;
  if (total !== undefined) {
    return parseInt(total, 10);
  }
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    return offset + parseInt(contentLength, 10);
  }
  return undefined;
}
