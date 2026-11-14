import { BLOB_AVAILABILITY_STATES, BLOB_OFFER_STATUSES } from '@tamanu/constants';
import { ERROR_TYPE, NotFoundError, RemoteCallError } from '@tamanu/errors';

// Bounded so a large blob is never held in memory whole. Mobile's upload API sends whole files, so
// it raises this past any blob's size.
export const DEFAULT_PUSH_CHUNK_BYTES = 8 * 1024 * 1024;

// Attempts that make progress don't count.
export const DEFAULT_STALLED_ATTEMPTS = 5;
export const DEFAULT_RETRY_BASE_MS = 500;

export interface BlobStat {
  size: number;
}

export interface FetchOutcome {
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

export interface BlobTransferHost {
  stat(hash: string): Promise<BlobStat | null>;
  stagedSize(hash: string): Promise<number>;
  commitStaged(hash: string): Promise<{ hash: string; size: number }>;
  fetchInto(hash: string, options: { offset: number }): Promise<FetchOutcome>;
  remoteAvailability(hash: string): Promise<RemoteAvailability>;
  offer(hash: string, options: { size: number }): Promise<OfferOutcome>;
  pushChunk(
    hash: string,
    options: { offset: number; length: number; totalSize: number },
  ): Promise<PushOutcome>;
  sleep(milliseconds: number): Promise<void>;
  onStall?(details: { hash: string; position: number; stalledAttempts: number }): void;
  /** Content the source doesn't hold yet is pending at its origin, not a transfer fault. */
  awaitingUploadError?(hash: string): Error;
}

export interface BlobTransferOptions {
  pushChunkBytes?: number;
  stalledAttempts?: number;
  retryBaseMs?: number;
  /** `always` probes first, for a host whose transfer API doesn't report the total. */
  probeTotalSize?: 'when-resuming' | 'always';
}

// spec: XFER
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
  async availability(
    hash: string,
    { stat }: { stat?: BlobStat | null } = {},
  ): Promise<RemoteAvailability> {
    const local = stat === undefined ? await this.#host.stat(hash) : stat;
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
  // spec: SCRUB
  /**
   * Held means the host's `stat`, so a host gating on servability refetches a copy that failed
   * verification.
   */
  async fetch(hash: string): Promise<{ hash: string; size: number; existed?: boolean }> {
    const held = await this.#host.stat(hash);
    if (held) {
      return { hash, size: held.size, existed: true };
    }

    // Staged bytes covering the known size leave only verification, where re-requesting from that
    // offset would earn a range-not-satisfiable.
    let knownSize: number | undefined;
    if (this.#probeTotalSize === 'always' || (await this.#host.stagedSize(hash)) > 0) {
      const remote = await this.#host.remoteAvailability(hash);
      if (remote.availability === BLOB_AVAILABILITY_STATES.AVAILABLE) {
        knownSize = remote.size;
      } else if (this.#probeTotalSize === 'always') {
        throw this.#host.awaitingUploadError?.(hash) ?? new NotFoundError(hash);
      }
    }

    let stalledAttempts = 0;
    for (;;) {
      const offset = await this.#host.stagedSize(hash);
      if (knownSize !== undefined && offset >= knownSize) {
        // Over-staged content fails verification at commit and is discarded.
        break;
      }

      try {
        const outcome = await this.#host.fetchInto(hash, { offset });
        knownSize = outcome.totalSize ?? knownSize;
      } catch (error) {
        if ((error as { type?: string })?.type === ERROR_TYPE.NOT_FOUND) {
          throw error;
        }
        stalledAttempts = await this.#backOff(hash, offset, stalledAttempts, error);
        continue;
      }

      const staged = await this.#host.stagedSize(hash);
      if (knownSize !== undefined && staged < knownSize) {
        // Ended early without erroring: back off anyway, so a peer returning truncated bodies is
        // paced.
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

    return await this.#host.commitStaged(hash);
  }

  // spec: XFER
  /**
   * The receiver acknowledges only once it has verified and durably stored the content, so the
   * local copy is then evictable.
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
          // The receiver's hash didn't match what we sent: local integrity's problem, not a
          // retry's.
          throw error;
        }
        if (type === ERROR_TYPE.FORBIDDEN) {
          // spec: BLAC
          // The referencing record hasn't synced to the receiver yet; retrying before a sync can't
          // change the answer.
          throw error;
        }

        // A failed re-offer is just another stalled attempt; it mustn't abort the push and swallow
        // the original error.
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
      // Every byte delivered but the receiver still expects more: the sizes disagree.
      throw new RemoteCallError(`Push of ${hash} delivered ${offset} bytes without acknowledgement`);
    }
    return outcome;
  }

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
      // No backoff for an attempt that moved bytes; a zero-length sleep also traps hosts whose
      // tests use fake timers.
      this.#host.onStall?.({ hash, position: staged, stalledAttempts: stalled });
      await this.#host.sleep(this.#retryBaseMs * stalled);
    }
    return stalled;
  }
}

/** `content-length` is relative to the offset the range started at. */
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

export const blobEndpoints = {
  content: (hash: string) => `blob/${encodeURIComponent(hash)}`,
  availability: (hash: string) => `blob/${encodeURIComponent(hash)}/availability`,
  offer: (hash: string) => `blob/${encodeURIComponent(hash)}/offer`,
  upload: (hash: string) => `blob/${encodeURIComponent(hash)}/content`,
};

export function rangeHeader(offset: number): Record<string, string> {
  return offset > 0 ? { range: `bytes=${offset}-` } : {};
}
