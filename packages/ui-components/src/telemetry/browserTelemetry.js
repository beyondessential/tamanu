import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

import { TELEMETRY_MAX_BATCH_SIZE } from '@tamanu/constants';

import { createTelemetryExporter } from './telemetryExporter';
import { TelemetryNavigationTracker } from './navigationTracker';
import { TELEMETRY_TRACER_NAME } from './spanKeys';

// spec: BTEL
// Pre-login navigations go to this unauthenticated-tolerant facility-server
// route; once signed in the client's bearer token rides along automatically.
export const TELEMETRY_ENDPOINT = 'public/telemetry';

// Fixed for now; making the send interval and sample rate configurable is a
// separate ticket.
const SEND_INTERVAL_MS = 15000;

// Browsers allow a page being unloaded only a small total body across all its
// keepalive requests (64 KiB in Chromium), and reject the send outright above
// it — losing the whole batch. The routine flush is unaffected, so this only
// bounds the final flush: send as much of it as will fit rather than risk
// losing all of it. Telemetry is best-effort, so dropping the tail is fine.
const KEEPALIVE_MAX_SPANS = 100;

/**
 * Wire up browser performance telemetry for one web client.
 *
 * @param {object} options
 * @param {import('@tamanu/api-client').TamanuApi} options.api the client whose
 *   requests are timed and through which batches are sent
 * @param {() => object} options.getContextAttributes returns { interface,
 *   deviceId, appVersion, sessionId?, userId? } — read fresh per span
 * @param {() => boolean} [options.isEnabled] whether telemetry is on (defaults on,
 *   so pre-login collection works before the facility setting is known)
 * @returns {{ startNavigation: Function, shutdown: Function }}
 */
export function initBrowserTelemetry({
  api,
  getContextAttributes,
  isEnabled = () => true,
  quietWindowMs,
  maxDurationMs,
}) {
  // Set only while the page is going away, so the unload flush uses keepalive and
  // the routine interval flush does not. Browsers cap the total body of keepalive
  // requests at 64 KiB and reject anything larger, which would silently drop the
  // busiest batches — exactly the page loads worth measuring.
  let isUnloading = false;

  const exporter = createTelemetryExporter(spans => {
    if (!spans.length || !isEnabled()) return Promise.resolve();
    const batch = isUnloading ? spans.slice(0, KEEPALIVE_MAX_SPANS) : spans;
    // background: excluded from the quiet calc. Never toast telemetry failures.
    return api.post(
      TELEMETRY_ENDPOINT,
      { spans: batch },
      { background: true, keepalive: isUnloading, showUnknownErrorToast: false },
    );
  });

  const provider = new WebTracerProvider();
  provider.addSpanProcessor(
    new BatchSpanProcessor(exporter, {
      scheduledDelayMillis: SEND_INTERVAL_MS,
      // The ingest endpoint rejects anything larger, and the SDK default (512)
      // exceeds it, so a full batch would be refused outright.
      maxExportBatchSize: TELEMETRY_MAX_BATCH_SIZE,
    }),
  );
  const tracer = provider.getTracer(TELEMETRY_TRACER_NAME);

  const tracker = new TelemetryNavigationTracker({
    tracer,
    getContextAttributes,
    quietWindowMs,
    maxDurationMs,
  });

  // The telemetry POST is itself a request; skip it so telemetry doesn't describe
  // itself (or loop). Matched by id across the start/settle edges.
  const ignoredRequestIds = new Set();
  api.setTelemetrySink(event => {
    if (!isEnabled()) return;
    if (event.phase === 'start') {
      if (event.endpoint === TELEMETRY_ENDPOINT) {
        ignoredRequestIds.add(event.id);
        return;
      }
      tracker.onRequestStart(event);
      return;
    }
    if (ignoredRequestIds.has(event.id)) {
      ignoredRequestIds.delete(event.id);
      return;
    }
    tracker.onRequestSettle(event);
  });

  const flush = () => {
    isUnloading = true;
    provider.forceFlush?.().catch(() => {});
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush);
    window.addEventListener('visibilitychange', () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flush();
    });
  }

  return {
    startNavigation: (route, pathParams, query) => {
      if (isEnabled()) tracker.startNavigation(route, pathParams, query);
    },
    shutdown: () => provider.shutdown(),
  };
}
