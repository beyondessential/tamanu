import { BLOB_AVAILABILITY_STATES, BLOB_OFFER_STATUSES } from '@tamanu/constants';
import { ERROR_TYPE, NotFoundError, RemoteCallError } from '@tamanu/errors';

// Bytes per push request. Bounded so a large blob is never held in memory
// whole, while each request stays big enough that per-request overhead doesn't
// dominate. Hosts override it: mobile's upload API sends whole files, so it
// raises the bound past any blob's size and delivers the remainder in one.
export const DEFAULT_PUSH_CHUNK_BYTES = 8 * 1024 * 1024;

// Consecutive attempts that deliver no new bytes before a transfer gives up.
// Attempts that make progress don't count: a transfer that keeps inching
// forward over a poor link is working as intended.
export const DEFAULT_STALLED_ATTEMPTS = 5;
export const DEFAULT_RETRY_BASE_MS = 500;

export interface BlobStat {
  size: number;
}

export interface FetchOutcome {
  /** Set when the host learned the content's total size from the response. */
  totalSize?: number;
}

export interface OfferOutcome {
  status: string;
  receivedBytes?: number;
}

export interface PushOutcome {
  acknowledged?: boolean;
  receivedBytes?: number;
}

export interface RemoteAvailability {
  availability: string;
  size?: number;
}

/**
 * The IO the transfer state machines drive. Every port speaks counts, offsets
 * and hashes: the host moves the bytes, this package decides which bytes move
 * and when.
 */
export interface BlobTransferHost {
  stat(hash: string): Promise<BlobStat | null>;
  stagedSize(hash: string): Promise<number>;
  commitStaged(hash: string): Promise<{ hash: string; size: number }>;
  /** Appends the source's bytes from `offset` onto the staging for `hash`. */
  fetchInto(hash: string, options: { offset: number }): Promise<FetchOutcome>;
  remoteAvailability(hash: string): Promise<RemoteAvailability>;
  offer(hash: string, options: { size: number }): Promise<OfferOutcome>;
  /** Sends `length` bytes read from `offset` of the locally held content. */
  pushChunk(
    hash: string,
    options: { offset: number; length: number; totalSize: number },
  ): Promise<PushOutcome>;
  sleep(milliseconds: number): Promise<void>;
  /** Diagnostics for an attempt that made no progress. */
  onStall?(details: { hash: string; position: number; stalledAttempts: number }): void;
  /**
   * The error for content the source does not hold yet: content-pending at its
   * origin, not a transfer fault. Defaults to a NotFoundError.
   */
  awaitingUploadError?(hash: string): Error;
}

export interface BlobTransferOptions {
  pushChunkBytes?: number;
  stalledAttempts?: number;
  retryBaseMs?: number;
  /**
   * When the total size is learned. `when-resuming` (the default) reads it from
   * the response and only probes to resolve staged bytes; `always` probes
   * first, for a host whose transfer API does not report the total.
   */
  probeTotalSize?: 'when-resuming' | 'always';
}

// spec: XFER
/**
 * The transfer state machines: availability (with the awaiting-upload /
 * awaiting-fetch distinction), resumable fetch from the source, and resumable
 * chunked push to it.
 *
 * This is the primitive layer: it moves one blob per call and resumes across
 * interruptions within the call. Scheduling — background pushing, retry over
 * hours, eviction — belongs to the cache tier above it (see
 * specs/blob-storage/facility-cache.md).
 */
export class BlobTransfer {
  #host: BlobTransferHost;
  #pushChunkBytes: number;
  #stalledAttemptLimit: number;
  #retryBaseMs: number;
  #probeTotalSize: 'when-resuming' | 'always';

  constructor(host: BlobTransferHost, options: BlobTransferOptions = {}) {
    this.#host = host;
    this.#pushChunkBytes = options.pushChunkBytes ?? DEFAULT_PUSH_CHUNK_BYTES;
    this.#stalledAttemptLimit = options.stalledAttempts ?? DEFAULT_STALLED_ATTEMPTS;
    this.#retryBaseMs = options.retryBaseMs ?? DEFAULT_RETRY_BASE_MS;
    this.#probeTotalSize = options.probeTotalSize ?? 'when-resuming';
  }

  // spec: XFER
  /**
   * Availability of a referenced hash as served from here: bytes held locally
   * are available; bytes the source holds are awaiting our fetch; bytes the
   * source lacks are awaiting upload from their origin.
   */
  async availability(hash: string): Promise<RemoteAvailability> {
    const local = await this.#host.stat(hash);
    if (local) {
      return { availability: BLOB_AVAILABILITY_STATES.AVAILABLE, size: local.size };
    }
    const remote = await this.#host.remoteAvailability(hash);
    if (remote.availability === BLOB_AVAILABILITY_STATES.AVAILABLE) {
      return { availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH, size: remote.size };
    }
    return { availability: remote.availability };
  }

  // spec: XFER
  /**
   * Fetch a blob's bytes from the source into the local store. Idempotent:
   * content already held skips the transfer. An interrupted download resumes
   * from the bytes already staged, including across calls and restarts, and the
   * complete content is verified against the hash before it is admitted.
   *
   * spec: SCRUB — what counts as held is the host's `stat`, so a host that gates
   * on servability fetches a replacement for a copy that failed verification
   * rather than treating the bad bytes as content it holds.
   */
  async fetch(hash: string): Promise<{ hash: string; size: number; existed?: boolean }> {
    const held = await this.#host.stat(hash);
    if (held) {
      return { hash, size: held.size, existed: true };
    }

    // The size the source holds for this hash, once learned (from a resume probe
    // or a response). Staged bytes covering it mean only verification is left —
    // including when a previous call was interrupted between staging the final
    // byte and committing, where re-requesting from that offset would only ever
    // earn a range-not-satisfiable refusal.
    let knownSize: number | undefined;
    if (this.#probeTotalSize === 'always' || (await this.#host.stagedSize(hash)) > 0) {
      const remote = await this.#host.remoteAvailability(hash);
      if (remote.availability === BLOB_AVAILABILITY_STATES.AVAILABLE) {
        knownSize = remote.size;
      } else if (this.#probeTotalSize === 'always') {
        // The probe is this host's only source of the total, so content the
        // source does not hold cannot be fetched at all.
        throw this.#host.awaitingUploadError?.(hash) ?? new NotFoundError(hash);
      }
    }

    let stalledAttempts = 0;
    for (;;) {
      const offset = await this.#host.stagedSize(hash);
      if (knownSize !== undefined && offset >= knownSize) {
        // Everything is staged; commit verifies it. Over-staged content fails
        // verification there and is discarded, so the next call starts clean.
        break;
      }

      try {
        const outcome = await this.#host.fetchInto(hash, { offset });
        knownSize = outcome.totalSize ?? knownSize;
      } catch (error) {
        if ((error as { type?: string })?.type === ERROR_TYPE.NOT_FOUND) {
          // The source doesn't hold the bytes: content-pending at the origin,
          // not a transfer fault. Nothing to resume.
          throw error;
        }
        stalledAttempts = await this.#backOff(hash, offset, stalledAttempts, error);
        continue;
      }

      const staged = await this.#host.stagedSize(hash);
      if (knownSize !== undefined && staged < knownSize) {
        // The stream ended early without erroring; go around for the rest,
        // backing off the same as the error path so a peer that keeps returning
        // truncated bodies is paced rather than hammered.
        stalledAttempts = await this.#backOff(
          hash,
          offset,
          stalledAttempts,
          new RemoteCallError(`Fetch of ${hash} stalled at ${staged} of ${knownSize} bytes`),
        );
        continue;
      }
      break;
    }

    // Verifies the complete content, including bytes staged before any
    // interruption; a mismatch discards the staging so the next attempt starts
    // clean.
    return await this.#host.commitStaged(hash);
  }

  // spec: XFER
  /**
   * Deliver a locally held blob's bytes to the source. Idempotent: content the
   * receiver already holds is acknowledged without transfer. The acknowledgement
   * arrives only once the receiver has verified and durably stored the content,
   * so the caller may treat the local copy as evictable. An interrupted push
   * resumes from the bytes the receiver has already staged.
   */
  async push(hash: string): Promise<PushOutcome & { existed?: boolean }> {
    const held = await this.#host.stat(hash);
    if (!held) {
      throw new NotFoundError(`Cannot push a blob not held locally: ${hash}`);
    }
    const { size } = held;

    const offer = await this.#host.offer(hash, { size });
    if (offer.status === BLOB_OFFER_STATUSES.ALREADY_STORED) {
      return { acknowledged: true, existed: true };
    }

    let offset = offer.receivedBytes ?? 0;
    let stalledAttempts = 0;
    for (;;) {
      try {
        return await this.#pushFrom(hash, size, offset);
      } catch (error) {
        const type = (error as { type?: string })?.type;
        if (type === ERROR_TYPE.BLOB_HASH_MISMATCH) {
          // The receiver discarded the staged content: what we sent doesn't
          // match the hash we hold it under. Local integrity's problem, not a
          // transfer retry's (see specs/blob-storage/integrity.md).
          throw error;
        }
        if (type === ERROR_TYPE.FORBIDDEN) {
          // spec: BLAC
          // The receiver refuses the push: the blob's referencing record hasn't
          // synchronised there yet (or isn't in our scope). Retrying without a
          // sync in between cannot change the answer, so fail the push now and
          // let the pusher move on to the next blob (see
          // specs/blob-storage/facility-cache.md).
          throw error;
        }

        // Learn where the receiver actually got to and resume from there — covers
        // a connection dropped mid-chunk, where it staged part of the body we
        // sent. A re-offer that itself fails is just another transient fault:
        // count it as a stalled attempt and retry from the same offset, rather
        // than letting it abort the push and swallow the original error.
        let reoffer: OfferOutcome;
        try {
          reoffer = await this.#host.offer(hash, { size });
        } catch {
          stalledAttempts += 1;
          if (stalledAttempts >= this.#stalledAttemptLimit) {
            throw error;
          }
          await this.#host.sleep(this.#retryBaseMs * stalledAttempts);
          continue;
        }
        if (reoffer.status === BLOB_OFFER_STATUSES.ALREADY_STORED) {
          return { acknowledged: true, existed: true };
        }

        const receiverOffset = reoffer.receivedBytes ?? 0;
        stalledAttempts = receiverOffset > offset ? 0 : stalledAttempts + 1;
        if (stalledAttempts >= this.#stalledAttemptLimit) {
          throw error;
        }
        this.#host.onStall?.({ hash, position: receiverOffset, stalledAttempts });
        offset = receiverOffset;
        await this.#host.sleep(this.#retryBaseMs * stalledAttempts);
      }
    }
  }

  async #pushFrom(hash: string, size: number, startOffset: number): Promise<PushOutcome> {
    if (startOffset >= size) {
      // A zero-byte blob, or the receiver already staged every byte (say it
      // restarted before finalising): one empty delivery completes it.
      return await this.#host.pushChunk(hash, {
        offset: startOffset,
        length: 0,
        totalSize: size,
      });
    }

    let offset = startOffset;
    let outcome: PushOutcome | undefined;
    while (offset < size) {
      const length = Math.min(this.#pushChunkBytes, size - offset);
      outcome = await this.#host.pushChunk(hash, { offset, length, totalSize: size });
      offset += length;
    }

    if (!outcome?.acknowledged) {
      // Every byte was delivered but the receiver still expects more: the sizes
      // disagree. Retriable via re-offer, which resets the shared position.
      throw new RemoteCallError(`Push of ${hash} delivered ${offset} bytes without acknowledgement`);
    }
    return outcome;
  }

  /**
   * Counts an attempt that may or may not have moved bytes, and paces the next
   * one. Throws `error` once the stalled run reaches the limit.
   */
  async #backOff(
    hash: string,
    offset: number,
    stalledAttempts: number,
    error: unknown,
  ): Promise<number> {
    const staged = await this.#host.stagedSize(hash);
    const stalled = staged > offset ? 0 : stalledAttempts + 1;
    if (stalled >= this.#stalledAttemptLimit) {
      throw error;
    }
    if (stalled > 0) {
      // An attempt that moved bytes earns no backoff: pacing is for a peer that
      // is delivering nothing, and a zero-length sleep is a trap for a host
      // whose tests run on fake timers.
      this.#host.onStall?.({ hash, position: staged, stalledAttempts: stalled });
      await this.#host.sleep(this.#retryBaseMs * stalled);
    }
    return stalled;
  }
}

/**
 * The total size of ranged content, from the headers a ranged GET came back
 * with. `content-range` carries it directly; `content-length` is relative to the
 * offset the range started at.
 */
export function totalSizeFromHeaders({
  contentRange,
  contentLength,
  offset,
}: {
  contentRange?: string | null;
  contentLength?: string | null;
  offset: number;
}): number | undefined {
  const total = contentRange?.match(/^bytes \d+-\d+\/(?<total>\d+)$/)?.groups?.total;
  if (total !== undefined) {
    return parseInt(total, 10);
  }
  if (contentLength !== null && contentLength !== undefined) {
    return offset + parseInt(contentLength, 10);
  }
  return undefined;
}

/**
 * The transfer subprotocol's endpoints, relative to a server's API root. Both
 * hosts address them, so they live here rather than being spelled out twice.
 */
export const blobEndpoints = {
  content: (hash: string) => `blob/${encodeURIComponent(hash)}`,
  availability: (hash: string) => `blob/${encodeURIComponent(hash)}/availability`,
  offer: (hash: string) => `blob/${encodeURIComponent(hash)}/offer`,
  upload: (hash: string) => `blob/${encodeURIComponent(hash)}/content`,
};

/** The range header for a resume, or nothing when starting from the beginning. */
export function rangeHeader(offset: number): Record<string, string> {
  return offset > 0 ? { range: `bytes=${offset}-` } : {};
}
