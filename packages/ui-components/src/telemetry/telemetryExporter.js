import { ExportResultCode, hrTimeToMilliseconds } from '@opentelemetry/core';

import { SPAN_ATTR } from './spanKeys';

// spec: BTEL
// A custom OpenTelemetry SpanExporter that maps finished spans to the raw-event
// shape the facility server stores, and POSTs them there. Paired with a
// BatchSpanProcessor, so spans arrive here already batched on an interval.
//
// Telemetry is best-effort: a failed send is swallowed and the batch dropped
// (we report SUCCESS so the processor doesn't retry indefinitely). It never
// disrupts the application.

function readParentSpanId(span) {
  // v1 exposes `parentSpanId`; v2 exposes `parentSpanContext.spanId`.
  return span.parentSpanId ?? span.parentSpanContext?.spanId ?? null;
}

function spanToPayload(span) {
  const attributes = span.attributes ?? {};
  let parameters = {};
  try {
    parameters = attributes[SPAN_ATTR.PARAMETERS]
      ? JSON.parse(attributes[SPAN_ATTR.PARAMETERS])
      : {};
  } catch {
    parameters = {};
  }

  return {
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
    parentId: readParentSpanId(span),
    kind: attributes[SPAN_ATTR.KIND],
    route: attributes[SPAN_ATTR.ROUTE],
    parameters,
    method: attributes[SPAN_ATTR.METHOD] ?? null,
    statusCode: attributes[SPAN_ATTR.STATUS_CODE] ?? null,
    durationMs: Math.round(hrTimeToMilliseconds(span.duration)),
    outcome: attributes[SPAN_ATTR.OUTCOME] ?? null,
    deviceId: attributes[SPAN_ATTR.DEVICE_ID],
    sessionId: attributes[SPAN_ATTR.SESSION_ID] ?? null,
    appVersion: attributes[SPAN_ATTR.APP_VERSION],
    userId: attributes[SPAN_ATTR.USER_ID] ?? null,
    occurredAt: new Date(hrTimeToMilliseconds(span.startTime)).toISOString(),
  };
}

/**
 * @param {(spans: object[]) => Promise<void>} send transport that posts a batch
 *   of span payloads to the facility server
 */
export function createTelemetryExporter(send) {
  return {
    export(spans, resultCallback) {
      const payloads = spans.map(spanToPayload);
      Promise.resolve()
        .then(() => send(payloads))
        .catch(() => {
          // best-effort: drop the batch, never retry or surface
        })
        .finally(() => resultCallback({ code: ExportResultCode.SUCCESS }));
    },
    shutdown() {
      return Promise.resolve();
    },
    forceFlush() {
      return Promise.resolve();
    },
  };
}

export { spanToPayload };
