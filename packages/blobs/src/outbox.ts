// Upper bound on outbox rows scanned per pass, so an outbox that grew large
// during an extended outage never materialises whole in memory (nor produces a
// huge `IN (…)` eligibility list). Oldest-first, so the longest-waiting blobs
// are always handled; the rest are picked up on subsequent passes.
export const DEFAULT_OUTBOX_SCAN_LIMIT = 1000;

export interface OutboxCounts {
  pushed: number;
  failed: number;
  skipped: number;
  ineligible: number;
  inFlight: number;
}

/**
 * Resolves which of the given hashes a consumer considers pushable, i.e. whose
 * referencing record has synchronised.
 */
export type BlobReferenceResolver = (hashes: string[]) => Promise<Iterable<string>>;

export interface BlobOutboxHost {
  /** Outbox hashes, oldest-first, at most `limit`. */
  listOutbox(limit: number): Promise<string[]>;
  push(hash: string): Promise<{ acknowledged?: boolean } | undefined>;
  demote(hash: string): Promise<void>;
  onWarning?(message: string, details: Record<string, unknown>): void;
}

export interface BlobOutboxOptions {
  /**
   * Consumers register theirs at startup, which can be after construction, so
   * pass a getter when the set is not final yet.
   */
  resolvers?: BlobReferenceResolver[] | (() => BlobReferenceResolver[]);
  scanLimit?: number;
}

// spec: CACHE
/**
 * Drains the outbox to the receiving server: oldest-first among blobs whose
 * referencing record has synchronised, skipping past failures, one transfer in
 * flight per blob.
 */
export class BlobOutbox {
  #host: BlobOutboxHost;
  #resolvers: BlobReferenceResolver[] | (() => BlobReferenceResolver[]);
  #scanLimit: number;
  #inFlight = new Set<string>();

  constructor(host: BlobOutboxHost, { resolvers = [], scanLimit }: BlobOutboxOptions = {}) {
    this.#host = host;
    this.#resolvers = resolvers;
    this.#scanLimit = scanLimit ?? DEFAULT_OUTBOX_SCAN_LIMIT;
  }

  /** Hashes whose transfer is running right now. */
  get inFlight(): string[] {
    return [...this.#inFlight];
  }

  // spec: CACHE
  /**
   * Which of these outbox blobs are eligible for push — a referencing record
   * has synchronised to the receiving server, determined locally by the
   * consumers' reference resolvers. With no resolvers registered nothing is
   * eligible, so the pusher stays idle until a consumer arrives.
   */
  async eligibleHashes(hashes: string[]): Promise<Set<string>> {
    const eligible = new Set<string>();
    if (hashes.length === 0) {
      return eligible;
    }
    const resolvers = typeof this.#resolvers === 'function' ? this.#resolvers() : this.#resolvers;
    for (const resolver of resolvers) {
      // Isolate resolvers: one consumer's failing query (e.g. a schema mismatch)
      // must not starve every other consumer's blobs of eligibility.
      try {
        for (const hash of await resolver(hashes)) {
          eligible.add(hash);
        }
      } catch (error) {
        this.#host.onWarning?.('a reference resolver failed, skipping it this pass', {
          error: (error as Error).message,
        });
      }
    }
    return eligible;
  }

  /** One pass over the outbox; the scheduled task calls this. */
  async runOnce(): Promise<OutboxCounts> {
    const outbox = await this.#host.listOutbox(this.#scanLimit);
    const counts: OutboxCounts = { pushed: 0, failed: 0, skipped: 0, ineligible: 0, inFlight: 0 };
    if (outbox.length === 0) {
      return counts;
    }

    const eligible = await this.eligibleHashes(outbox);
    for (const hash of outbox) {
      if (!eligible.has(hash)) {
        counts.ineligible += 1;
        continue;
      }
      if (this.#inFlight.has(hash)) {
        // spec: CACHE — at most one transfer in flight per blob
        counts.inFlight += 1;
        continue;
      }
      this.#inFlight.add(hash);
      try {
        const result = await this.#host.push(hash);
        if (!result?.acknowledged) {
          // Neither thrown nor acknowledged: leave it in the outbox, don't count
          // it as pushed, and try again on a later pass.
          counts.skipped += 1;
          this.#host.onWarning?.('push returned without acknowledgement, will retry', { hash });
        } else {
          // spec: XFER — acknowledgement means the bytes are verified and durably
          // stored on the receiver, so the push is done even if the local demotion
          // fails; a later idempotent re-offer will re-demote.
          counts.pushed += 1;
          try {
            await this.#host.demote(hash);
          } catch (error) {
            this.#host.onWarning?.('pushed but local demotion failed, will re-demote', {
              hash,
              error: (error as Error).message,
            });
          }
        }
      } catch (error) {
        // spec: CACHE — a refused or failed offer does not block the queue
        counts.failed += 1;
        this.#host.onWarning?.('push failed, continuing with next blob', {
          hash,
          error: (error as Error).message,
        });
      } finally {
        this.#inFlight.delete(hash);
      }
    }

    return counts;
  }
}
