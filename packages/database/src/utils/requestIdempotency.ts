import { createHash } from 'node:crypto';
import type { ExpressRequest } from 'types/express';
import type { NextFunction, Response } from 'express';

import { IDEMPOTENCY_KEY_STATUSES } from '@tamanu/constants';

// spec: IDEM
//
// Server-side request idempotency. A mutating request that carries an
// `Idempotency-Key` header is executed at most once to successful completion:
// the first execution's outcome is recorded against the key, and any later
// request carrying the same key returns that recorded outcome instead of running
// the handler again. This is what lets a client durably retry a request after a
// dropped connection without creating duplicate records.
//
// Design (see .workhorse/plans/w1/plan.md): a single wrapping transaction. The
// handler runs inside a transaction owned by this middleware, so — because the
// project binds the current transaction to the async context via
// `Sequelize.useCLS()` — the handler's own database writes enrol in it with no
// handler change. The key record and the handler's writes therefore commit
// atomically. The response is buffered and only flushed after commit, so the
// client never sees a success the database didn't keep. A non-2xx response rolls
// the transaction back, recording nothing, so the operation stays retryable.

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Sentinel used to force the wrapping transaction to roll back without treating
// it as a real error — the response is already buffered and gets flushed after.
class IdempotencyRollback extends Error {}

interface CapturedResponse {
  statusCode: number;
  body: unknown;
  kind: 'json' | 'send' | 'end';
  endArgs?: unknown[];
  contentType?: string;
}

interface RequestIdempotencyOptions {
  // Path matchers (tested against `req.path`) that opt out of idempotent handling
  // even when a key is present — e.g. token-issuing, streaming/sync, AI endpoints.
  excludePaths?: RegExp[];
  // How long a recorded key is retained before the cleanup task may remove it.
  retentionMs?: number;
  // How long an in-progress claim is honoured before it is treated as abandoned
  // and may be reclaimed. Only reachable once a committed in-progress marker is
  // used (see the plan's transaction-topology note); harmless under Design A.
  leaseMs?: number;
}

const DEFAULT_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_LEASE_MS = 5 * 60 * 1000; // 5 minutes

function fingerprintRequest(method: string, path: string, body: unknown): string {
  // Binds the key to the specific request so the same key reused for a different
  // operation is detected. Body key order is not normalised — a client that
  // serialises its body consistently across retries (the expected case) produces
  // a stable hash.
  const payload = `${method}\n${path}\n${body === undefined ? '' : JSON.stringify(body)}`;
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Build the request-idempotency middleware. Each server passes its own
 * `excludePaths` so the skip-list matches its route layout.
 */
export function createRequestIdempotencyMiddleware({
  excludePaths = [],
  retentionMs = DEFAULT_RETENTION_MS,
  leaseMs = DEFAULT_LEASE_MS,
}: RequestIdempotencyOptions = {}) {
  const isExcluded = (path: string) => excludePaths.some(pattern => pattern.test(path));

  return async function requestIdempotency(
    req: ExpressRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const key = req.get(IDEMPOTENCY_KEY_HEADER);

    // Opt-in: no key, non-mutating, or excluded path → handle normally.
    if (!key || !MUTATING_METHODS.has(req.method) || isExcluded(req.path)) {
      next();
      return;
    }

    const userId = req.user?.id;
    const facilityId = req.facilityId;
    // Without a scope we cannot safely key the record — handle normally.
    if (!userId || !facilityId) {
      next();
      return;
    }

    const sequelize = req.db;
    const { IdempotencyKey } = req.models;
    const requestHash = fingerprintRequest(req.method, req.path, req.body);
    const scope = { key, userId, facilityId };

    // Servers that require every endpoint to declare a permission check do it by
    // leaving a `res.send` that throws until a handler flags one. The interceptors
    // below sit in front of that stub, so its throw would land only once we flush
    // — after this transaction had committed — quietly turning a missing
    // permission check into a committed, replayable success. Observe the flag so an
    // unflagged request can be failed and rolled back instead.
    let permissionChecked = false;
    const declarePermissionChecked = req.flagPermissionChecked;
    if (declarePermissionChecked) {
      req.flagPermissionChecked = () => {
        permissionChecked = true;
        declarePermissionChecked.call(req);
      };
    }

    // --- Buffer the response instead of writing it to the socket. ---
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);
    let intercepting = true;
    let captured: CapturedResponse | undefined;
    let onResponded: () => void = () => {};
    const responded = new Promise<void>(resolve => {
      onResponded = resolve;
    });
    const capture = (kind: CapturedResponse['kind'], body: unknown, endArgs?: unknown[]) => {
      if (captured) return; // capture once; ignore any follow-on calls
      const contentType = res.getHeader('content-type');
      captured = {
        statusCode: res.statusCode,
        body,
        kind,
        endArgs,
        contentType: typeof contentType === 'string' ? contentType : undefined,
      };
      onResponded();
    };
    res.json = function interceptJson(body: unknown) {
      if (intercepting) {
        capture('json', body);
        return res;
      }
      return originalJson(body);
    } as Response['json'];
    res.send = function interceptSend(body: unknown) {
      if (intercepting) {
        capture('send', body);
        return res;
      }
      return originalSend(body);
    } as Response['send'];
    res.end = function interceptEnd(chunk: unknown, ...args: unknown[]) {
      if (intercepting) {
        capture('end', chunk, args);
        return res;
      }
      return (originalEnd as (...a: unknown[]) => Response)(chunk, ...args);
    } as Response['end'];

    // What to do once the transaction has resolved: replay a stored/immediate
    // outcome, or flush what the handler produced.
    let replayRecord: InstanceType<typeof IdempotencyKey> | undefined;
    let conflict: 'mismatch' | 'in_progress' | undefined;

    // The recorded form of the handler's response body.
    //
    // Most handlers here respond with `res.send`, and `ensurePermissionCheck`
    // restores its own `res.send` when a handler flags its permission check —
    // which drops the override above. Those responses therefore reach us at
    // `res.end` as an already-serialised chunk, so decode it back into a value
    // worth storing rather than recording nothing.
    const recordedBody = (): unknown => {
      if (!captured) return null;
      if (captured.kind !== 'end') return captured.body;

      const chunk = captured.body;
      if (chunk === null || chunk === undefined) return null;
      const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      if (text === '') return null;
      if (captured.contentType?.includes('json')) {
        try {
          return JSON.parse(text);
        } catch {
          return text; // not the JSON it claimed to be; keep it verbatim
        }
      }
      return text;
    };

    const flush = () => {
      intercepting = false;
      // When we answer without running the handler — a replay or a conflict — no
      // handler ran to declare a permission check, so the guard's `res.send` stub
      // would throw. Declare it here: an outcome is only ever recorded for a
      // request that declared its own check (see the rollback above), and the key
      // is scoped to user + facility and bound to the request hash, so a replay
      // returns the same user their own outcome for the same request. A conflict
      // discloses nothing. Guarded because not every server installs the check.
      if ((conflict || replayRecord) && declarePermissionChecked) {
        declarePermissionChecked.call(req);
      }
      if (conflict === 'mismatch') {
        res
          .status(409)
          .json({ error: { message: 'Idempotency-Key reused with a different request' } });
        return;
      }
      if (conflict === 'in_progress') {
        res
          .status(409)
          .json({ error: { message: 'A request with this Idempotency-Key is already in progress' } });
        return;
      }
      if (replayRecord) {
        res.status(replayRecord.responseStatus ?? 200);
        const body = replayRecord.responseBody;
        const contentType = replayRecord.responseContentType;
        if (body === null || body === undefined) {
          (originalEnd as (...a: unknown[]) => Response)();
          return;
        }
        // Reproduce a non-JSON response as it was; anything else is JSON, which
        // res.json serialises and labels for us.
        if (contentType && !contentType.includes('json')) {
          res.setHeader('Content-Type', contentType);
          (originalEnd as (...a: unknown[]) => Response)(String(body));
          return;
        }
        originalJson(body);
        return;
      }
      if (!captured) return; // nothing to flush (handler produced no response)
      res.status(captured.statusCode);
      if (captured.kind === 'json') originalJson(captured.body);
      else if (captured.kind === 'send') originalSend(captured.body);
      else (originalEnd as (...a: unknown[]) => Response)(captured.body, ...(captured.endArgs ?? []));
    };

    try {
      await sequelize.transaction(async () => {
        // Claim the key. findOrCreate isolates the concurrent-insert race with an
        // internal savepoint, so a losing racer doesn't abort this transaction: it
        // returns the existing row instead. The unique index serialises concurrent
        // first-time claims for the same key.
        const [record, created] = await IdempotencyKey.findOrCreate({
          where: scope,
          defaults: {
            ...scope,
            method: req.method,
            path: req.path,
            requestHash,
            status: IDEMPOTENCY_KEY_STATUSES.IN_PROGRESS,
            claimedAt: new Date(),
            expiresAt: new Date(Date.now() + retentionMs),
          },
        });

        if (!created) {
          if (record.requestHash !== requestHash) {
            conflict = 'mismatch';
            return;
          }
          if (record.status === IDEMPOTENCY_KEY_STATUSES.COMPLETED) {
            replayRecord = record;
            return;
          }
          // An in-progress row (only reachable with a committed marker / after a
          // crash). Reclaim it if its lease has expired, else report it as running.
          const leaseExpired = Date.now() - new Date(record.claimedAt).getTime() > leaseMs;
          if (!leaseExpired) {
            conflict = 'in_progress';
            return;
          }
          // Reclaim the abandoned claim; the request hash already matched above.
          await record.update({ claimedAt: new Date() });
        }

        // Run the handler within this transaction's async context and wait for it
        // to produce a response. Its DB writes enrol in this transaction via CLS.
        next();
        await responded;

        const statusCode = captured?.statusCode ?? 500;
        // An endpoint that never declared a permission check is treated as a
        // failure: flushing its response raises the guard's error, so committing
        // here would persist writes for a request the client sees fail.
        const missingPermissionCheck = Boolean(declarePermissionChecked) && !permissionChecked;
        if (statusCode >= 400 || missingPermissionCheck) {
          // The operation failed. Roll back so neither its writes nor the claim
          // persist, leaving the operation retryable; the buffered error response
          // is flushed after.
          throw new IdempotencyRollback();
        }

        // Record the outcome in the same transaction as the handler's writes.
        await IdempotencyKey.update(
          {
            status: IDEMPOTENCY_KEY_STATUSES.COMPLETED,
            responseStatus: statusCode,
            responseBody: recordedBody(),
            responseContentType: captured?.contentType ?? null,
            completedAt: new Date(),
            expiresAt: new Date(Date.now() + retentionMs),
          },
          { where: scope },
        );
      });
    } catch (err) {
      if (!(err instanceof IdempotencyRollback)) {
        // Unexpected failure (e.g. the commit itself failed). Nothing was
        // recorded and the handler's writes rolled back; surface the error so the
        // client sees a failure rather than a false success.
        intercepting = false;
        next(err as Error);
        return;
      }
    }

    flush();
  };
}
