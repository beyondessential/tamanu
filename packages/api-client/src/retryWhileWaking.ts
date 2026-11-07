import { type LoggerType } from './TamanuApi';

/**
 * How long to wait for a Tamanu server that is waking from sleep.
 *
 * A server whose supervisor has put it to sleep answers `503 Service Unavailable` with a
 * `Retry-After` header while it wakes (see `specs/platform/supervisor/sleep-and-wake.md`). That is
 * not a failure: the caller waits as long as the header says and asks again.
 */
export interface WakeRetryOptions {
  /** Wait for this long when the server sends a `Retry-After` we cannot read. */
  defaultRetryAfterSeconds: number;
  /** Longest single wait, so a large `Retry-After` cannot park the caller between attempts. */
  maxRetryAfterSeconds: number;
  /** Most time one call spends waiting in all, after which the last 503 is thrown. */
  maxTotalWaitSeconds: number;
}

interface WakingResponse {
  status?: number;
  headers?: { get?: (name: string) => string | null };
}

/**
 * How long to wait before asking a waking server again, or null when this is not a waking server.
 *
 * `Retry-After` is a whole number of seconds (an HTTP date is also valid, which Tamanu does not
 * send). A 503 without one is an ordinary server error — an overloaded server, or a proxy with
 * nothing behind it — and must fail rather than park the caller for the whole wait budget.
 */
export function wakeRetryAfterSeconds(
  response: WakingResponse | undefined,
  { defaultRetryAfterSeconds, maxRetryAfterSeconds }: WakeRetryOptions,
): number | null {
  if (response?.status !== 503) return null;

  const header = response.headers?.get?.('retry-after');
  const trimmed = header?.trim() ?? '';
  if (trimmed === '') return null;

  // present but unreadable still means waking, so wait the default rather than failing
  const seconds = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : defaultRetryAfterSeconds;
  return Math.min(Math.max(seconds, 1), maxRetryAfterSeconds);
}

/**
 * Run a request, waiting out a server that answers that it is waking, for as long as it keeps
 * answering that way. Any other failure is thrown as it is, as is the last 503 once the caller has
 * waited `maxTotalWaitSeconds` in all, so a wake that never finishes does not wait forever.
 *
 * spec: SYNCHK#while-central-wakes
 */
export async function retryWhileWaking<T>(
  run: () => Promise<T>,
  options: WakeRetryOptions,
  { label, logger = console }: { label: string; logger?: LoggerType },
): Promise<T> {
  let waitedSeconds = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await run();
    } catch (error) {
      const retryAfterSeconds = wakeRetryAfterSeconds(
        (error as { response?: WakingResponse })?.response,
        options,
      );
      if (retryAfterSeconds === null) throw error;

      if (waitedSeconds + retryAfterSeconds > options.maxTotalWaitSeconds) {
        logger.warn('retryWhileWaking: waited too long for the server to wake', {
          label,
          waitedSeconds,
        });
        throw error;
      }

      logger.info('retryWhileWaking: server is waking, asking again', {
        label,
        retryAfterSeconds,
        waitedSeconds,
      });
      await new Promise<void>(resolve => {
        setTimeout(resolve, retryAfterSeconds * 1000);
      });
      waitedSeconds += retryAfterSeconds;
    }
  }
}
