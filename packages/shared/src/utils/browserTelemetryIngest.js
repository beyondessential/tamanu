import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { TELEMETRY_MAX_BATCH_SIZE } from '@tamanu/constants';

// spec: BTEL
// Shared ingest for browser performance telemetry. Every web client posts the
// same batch shape to whichever server it talks to — a facility server for the
// clinical app, central for the admin panel and the patient portal — and each
// writes to its own local raw store. The servers differ only in the facility
// they stamp, so they share this handler rather than keeping copies in step.
//
// Mounted on public routes so pre-login navigations are recorded; an
// authenticated client's batch simply carries a userId per span. The facility is
// stamped server-side, never trusted from the client. Best-effort: malformed or
// oversized batches are rejected, and patient-identifiable values (telemetry
// paths may hold search terms) are never logged.
//
// `occurredAt` is reported by the browser and so cannot be trusted for
// retention — the prune works from the server-stamped `createdAt` instead, so a
// client cannot keep its rows alive by dating them far in the future.

const spanSchema = z.object({
  traceId: z.string().min(1),
  spanId: z.string().min(1),
  parentId: z.string().nullish(),
  kind: z.string().min(1),
  route: z.string(),
  parameters: z.record(z.string(), z.any()).default({}),
  method: z.string().nullish(),
  statusCode: z.number().int().min(100).max(599).nullish(),
  durationMs: z.number().int().nonnegative(),
  outcome: z.string().nullish(),
  interface: z.string().min(1),
  deviceId: z.string().min(1),
  sessionId: z.string().nullish(),
  appVersion: z.string().min(1),
  userId: z.string().nullish(),
  // A real datetime, not just a non-empty string: an unparsable value would
  // reach Postgres and surface as a 500 from a public endpoint.
  occurredAt: z.iso.datetime({ offset: true }),
});

const batchSchema = z.object({
  spans: z.array(spanSchema).max(TELEMETRY_MAX_BATCH_SIZE),
});

/**
 * @param {object} [options]
 * @param {(req: object) => string | null} [options.getFacilityId] facility to stamp
 *   on each row. Defaults to none, which is correct for central.
 * @param {(req: object) => void} [options.onRequest] hook run before parsing, for
 *   server-specific concerns such as clearing the permission check.
 */
export function createBrowserTelemetryIngest({ getFacilityId, onRequest } = {}) {
  return asyncHandler(async (req, res) => {
    onRequest?.(req);

    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).send({ ok: false });
      return;
    }

    const { spans } = parsed.data;
    if (spans.length === 0) {
      res.status(204).send();
      return;
    }

    const facilityId = getFacilityId?.(req) ?? null;
    const { BrowserTelemetrySpan } = req.models;

    await BrowserTelemetrySpan.bulkCreate(
      spans.map(span => ({
        traceId: span.traceId,
        spanId: span.spanId,
        parentId: span.parentId ?? null,
        kind: span.kind,
        route: span.route,
        parameters: span.parameters ?? {},
        method: span.method ?? null,
        statusCode: span.statusCode ?? null,
        durationMs: span.durationMs,
        outcome: span.outcome ?? null,
        interface: span.interface,
        deviceId: span.deviceId,
        sessionId: span.sessionId ?? null,
        appVersion: span.appVersion,
        userId: span.userId ?? null,
        facilityId,
        occurredAt: span.occurredAt,
      })),
    );

    res.status(204).send();
  });
}
