import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { TELEMETRY_MAX_BATCH_SIZE } from '@tamanu/constants';

// spec: BTEL
// Ingests browser performance telemetry from the patient portal. The portal
// talks to central (not a facility server), so these raw spans are stored
// locally on central rather than on a facility; the same BrowserTelemetrySpan
// model is used. Registered before the portal auth middleware so pre-login
// navigations are recorded; facilityId is left null (central has no single
// facility).
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

export const portalTelemetryIngest = asyncHandler(async (req, res) => {
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
      facilityId: null,
      occurredAt: span.occurredAt,
    })),
  );

  res.status(204).send();
});
