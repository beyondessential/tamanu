// spec: BTEL
export { initBrowserTelemetry, TELEMETRY_ENDPOINT } from './browserTelemetry';
export { TelemetryNavigationTracker } from './navigationTracker';
export { createTelemetryExporter, spanToPayload } from './telemetryExporter';
export { SPAN_ATTR, TELEMETRY_TRACER_NAME } from './spanKeys';
