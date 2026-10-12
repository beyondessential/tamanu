// Bounds memory and the `IN (…)` eligibility list; the rest are picked up on later passes.
export const DEFAULT_OUTBOX_SCAN_LIMIT = 1000;

export interface OutboxCounts {
  pushed: number;
  failed: number;
  skipped: number;
  ineligible: number;
  inFlight: number;
}

export type BlobReferenceResolver = (hashes: string[]) => Promise<Iterable<string>>;

export interface BlobOutboxHost {
  listOutbox(limit: number): Promise<string[]>;
  push(hash: string): Promise<{ acknowledged?: boolean } | undefined>;
  demote(hash: string): Promise<void>;
  onWarning?(message: string, details: Record<string, unknown>): void;
}

export interface BlobOutboxOptions {
  /**
   * Consumers register at startup, possibly after construction, so pass a getter when the set isn't
   * final.
   */
  resolvers?: BlobReferenceResolver[] | (() => BlobReferenceResolver[]);
  scanLimit?: number;
}

// spec: CACHE
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

  get inFlight(): string[] {
    return [...this.#inFlight];
  }

  // spec: CACHE
  /** With no resolvers registered nothing is eligible. */
  async eligibleHashes(hashes: string[]): Promise<Set<string>> {
    const eligible = new Set<string>();
    if (hashes.length === 0) {
      return eligible;
    }
    const resolvers = typeof this.#resolvers === 'function' ? this.#resolvers() : this.#resolvers;
    for (const resolver of resolvers) {
      // One consumer's failing query must not starve every other consumer's blobs.
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
        // spec: CACHE
        counts.inFlight += 1;
        continue;
      }
      this.#inFlight.add(hash);
      try {
        const result = await this.#host.push(hash);
        if (!result?.acknowledged) {
          // Neither thrown nor acknowledged: retry on a later pass.
          counts.skipped += 1;
          this.#host.onWarning?.('push returned without acknowledgement, will retry', { hash });
        } else {
          // spec: XFER
          // The push is done even if the local demotion fails; a later re-offer re-demotes.
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
        // spec: CACHE
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
