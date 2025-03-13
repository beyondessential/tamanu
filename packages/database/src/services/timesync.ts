import * as yup from 'yup';
import { FACT_TIME_OFFSET } from '@tamanu/constants/facts';
import type { Models } from '../types/model';
import type { ReadSettings } from '@tamanu/settings';
import type { Logger } from 'winston';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

// This correctly implements https://web.archive.org/web/20160310125700/http://mine-control.com/zack/timesync/timesync.html
// The timesync package on npm doesn't compute latency correctly and also is broken on modern JS runtimes

/** Vanity type for microseconds (integer) */
export type Microseconds = number;

/** The current local system timestamp in integer microseconds */
function microtime(): Microseconds {
  return Math.round((performance.now() + performance.timeOrigin) * 1000);
}

/** NTP-like message exchanged for time synchronisation (request) */
export interface TimeRequest {
  client: Microseconds;
}

/** NTP-like message exchanged for time synchronisation (response) */
export interface TimeResponse {
  client: Microseconds;
  server: Microseconds;
}

const MicrosecondsValidator = yup.number().positive().integer().required();
export const TimeRequestValidator = yup.object({
  client: MicrosecondsValidator,
});
export const TimeResponseValidator = yup.object({
  client: MicrosecondsValidator,
  server: MicrosecondsValidator,
});

interface TimesyncSettings {
  enabled: boolean;
  interval: number;
  samples: number;
  jitter: number;
}

const NO_CONSTRUCTOR_ACCESS = Symbol();

/** Query implementation.
 * This should be something like an API call to the timesync endpoint.
 * The timeout must be respected: if it is reached, return null.
 */
export type QueryFn = (request: TimeRequest, timeoutMs: number) => Promise<TimeResponse | null>;

export interface CreateArgs {
  models: Models;
  settings: ReadSettings;
  log: Logger;

  /** A callback that performs a query to a timesync server and returns the response.
   * False to disable querying; in that case the offset will be reloaded at regular intervals.
   */
  query: QueryFn | false;
}

export class Timesync {
  #models: Models;
  #settings: ReadSettings;
  #log: Logger;
  #query: QueryFn | false;

  #offset: Microseconds = 0;
  #initial: boolean = false;

  /** Constructor. Do not use the direct constructor. */
  static async init(args: CreateArgs): Promise<Timesync> {
    const state = new Timesync(NO_CONSTRUCTOR_ACCESS, args);
    await state.reload();

    if (args.query) {
      // this is the thread that updates the offset, so start attempting that
      await state.#attempt();
    } else {
      // this is a non-updating / read-only thread, so reload the offset regularly
      setInterval(
        () =>
          state.reload().catch((err) => {
            args.log.error(`Timesync reload error: ${err}`);
          }),
        (args.settings.get('timesync.interval') as unknown as number) * 1000,
      );
    }

    return state;
  }

  /** Use init() instead. */
  constructor(noAccess: Symbol, { models, settings, log, query }: CreateArgs) {
    if (noAccess !== NO_CONSTRUCTOR_ACCESS) {
      throw new Error('Do not construct TimesyncState using new, use init() instead');
    }

    this.#models = models;
    this.#settings = settings;
    this.#log = log;
    this.#query = query;
  }

  /** Reload the current offset from database.
   * This can be useful when using in a multi-process environment.
   */
  async reload() {
    let currentOffset = await this.#models.LocalSystemFact.get(FACT_TIME_OFFSET);
    if (typeof currentOffset !== 'number') {
      currentOffset = '0';
      this.#initial = true;
      await this.#models.LocalSystemFact.set(FACT_TIME_OFFSET, currentOffset);
    }
    this.#offset = parseInt(currentOffset, 10);
  }

  /** The current adjusted time in microseconds since the epoch. */
  microtime(): Microseconds {
    return microtime() + this.#offset;
  }

  /** The current adjusted time as a Date */
  now(): Date {
    return new Date(this.microtime() / 1000);
  }

  #makeRequest(): TimeRequest {
    return {
      client: this.microtime(),
    };
  }

  /** Use this to implement the server endpoint.
   * The response must be sent as immediately after this as is practicable.
   * The endpoint should do as little branching as possible to keep timing smooth.
   */
  respond(request: TimeRequest): TimeResponse {
    return {
      ...request,
      server: this.microtime(),
    };
  }

  #processResponse(response: TimeResponse): ProcessedResponse {
    const current = this.microtime();
    const latency = Math.abs(response.server - response.client) / 2;
    const delta = response.server - current + latency;
    return { latency, delta };
  }

  async #saveOffset(offset: Microseconds): Promise<void> {
    this.#initial = false;
    this.#offset = offset;
    this.#log.debug('Timesync offset changed (us)', { offset });
    this.#models.LocalSystemFact.set(FACT_TIME_OFFSET, offset.toString());
  }

  async #attempt(): Promise<void> {
    const query = this.#query;
    if (!query) return;

    const { enabled, interval, jitter, samples } = (await this.#settings.get(
      'timesync',
    )) as TimesyncSettings;

    // schedule the next one immediately so the interval is regular
    setTimeout(
      () =>
        this.#attempt().catch((err) => {
          this.#log.error(`Uncaught timesync error: ${err}`);
        }),
      interval * 1000,
    );

    // it's a bit wasteful to still schedule attempts that do nothing,
    // but it means we can easily enable and disable timesync at runtime
    if (!enabled) return;

    let gap = 0;
    const responses: ProcessedResponse[] = [];
    for (let n = 0; n < samples; n += 1) {
      await sleepAsync(gap);

      // compute the next gap before we query, so if we error we don't immediately reloop
      gap = Math.random() * jitter;

      try {
        // timeout is half the interval, so we guarantee that we never overrun
        const response = await query(this.#makeRequest(), interval * 500);
        if (!response) continue;

        const processed = this.#processResponse(response);
        gap += processed.latency;
        responses.push(processed);
        if (this.#initial) {
          // when we don't have an offset at all, anything is better than nothing
          this.#saveOffset(processed.delta).catch((err) => {
            this.#log.error(`Timesync save error: ${err}`);
          });
        }
      } catch (err) {
        this.#log.error(`Timesync processing error: ${err}`);
      }
    }

    if (responses.length % 2 === 0) {
      // the first response is most likely to be an outlier, if we have to discard it
      responses.shift();
    }

    // not enough for confidence
    if (responses.length < 3) return;

    responses.sort((a, b) => a.latency - b.latency);
    const deltas = responses.map(({ delta }) => delta);

    const medianIdx = Math.floor(deltas.length / 2);
    const median = deltas[medianIdx]!;

    const mean = deltas.reduce((acc, d) => acc + d, 0);
    const variance =
      deltas.map((d) => Math.pow(d - mean, 2)).reduce((acc, d) => acc + d, 0) / (deltas.length - 1);
    const std = Math.sqrt(variance);

    const inliers = deltas.filter((d) => d <= median + std || d >= median - std);
    const offset = Math.round(deltas.reduce((acc, d) => acc + d, 0) / inliers.length);
    return this.#saveOffset(offset);
  }
}

type ProcessedResponse = {
  latency: Microseconds;
  delta: Microseconds;
};
