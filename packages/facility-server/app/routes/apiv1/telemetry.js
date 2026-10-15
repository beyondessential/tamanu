import express from 'express';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { TELEMETRY_MAX_BATCH_SIZE } from '@tamanu/constants';

import { getServerFacilityIds } from '../../serverConfig';

// spec: BTEL
// Ingests browser performance telemetry and writes it to the local raw store.
// Mounted before the auth middleware so pre-login navigations (the login screen)
// are recorded too; an authenticated client's batch simply carries a userId in
// each span. The facility is stamped from the server's own config, never trusted
// from the client. Best-effort: malformed or oversized batches are rejected, but
// a bad row never fails the whole request loudly.
export const telemetry = express.Router();

const spanSchema = z.object({
  traceId: z.string().min(1),
  spanId: z.string().min(1),
  parentId: z.string().nullish(),
  kind: z.string().min(1),
  route: z.string(),
  parameters: z.record(z.string(), z.any()).default({}),
  method: z.string().nullish(),
  statusCode: z.number().int().nullish(),
  durationMs: z.number().int().nonnegative(),
  outcome: z.string().nullish(),
  interface: z.string().min(1),
  deviceId: z.string().min(1),
  sessionId: z.string().nullish(),
  appVersion: z.string().min(1),
  userId: z.string().nullish(),
  occurredAt: z.string().min(1),
});

const batchSchema = z.object({
  spans: z.array(spanSchema).max(TELEMETRY_MAX_BATCH_SIZE),
});

telemetry.post(
  '/',
  asyncHandler(async (req, res) => {
    // Intentionally public: telemetry is collected before sign-in, and carries no
    // action a permission could gate.
    req.flagPermissionChecked();

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

    const [facilityId = null] = getServerFacilityIds() ?? [];
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
  }),
);
