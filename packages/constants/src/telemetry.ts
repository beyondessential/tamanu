// spec: BTEL
// Shared vocabulary for browser performance telemetry: the interfaces that
// collect it, the two kinds of span recorded, and the outcomes a navigation
// can end with. Kept in constants so the browser collector, the facility-server
// ingest endpoint, and the raw model all agree on the values.

export const TELEMETRY_INTERFACES = {
  CLINICAL: 'clinical',
  ADMIN: 'admin',
  PATIENT_PORTAL: 'patient-portal',
} as const;
export type TelemetryInterface =
  (typeof TELEMETRY_INTERFACES)[keyof typeof TELEMETRY_INTERFACES];

export const TELEMETRY_SPAN_KINDS = {
  NAVIGATION: 'navigation',
  REQUEST: 'request',
} as const;
export type TelemetrySpanKind =
  (typeof TELEMETRY_SPAN_KINDS)[keyof typeof TELEMETRY_SPAN_KINDS];

// How a navigation span ended:
// - settled: network went quiet within the cap (a normal page load)
// - abandoned: the user navigated away before it settled
// - capped: it never went quiet and was ended by the hard time cap
export const TELEMETRY_NAV_OUTCOMES = {
  SETTLED: 'settled',
  ABANDONED: 'abandoned',
  CAPPED: 'capped',
} as const;
export type TelemetryNavOutcome =
  (typeof TELEMETRY_NAV_OUTCOMES)[keyof typeof TELEMETRY_NAV_OUTCOMES];

// Upper bound on spans accepted in a single ingest batch, guarding the
// unauthenticated endpoint against oversized posts.
export const TELEMETRY_MAX_BATCH_SIZE = 500;

// spec: BTAG
// Upper bounds (inclusive, in milliseconds) of the duration bands that every
// aggregated trend row counts its events into, with a final open-ended band for
// anything slower. This is a permanent storage contract: rows are only
// combinable (to compute percentiles over any range, facility or release)
// because every row on every server and version uses the same bands. Never
// change or reorder these; a new band set needs a new column.
export const TELEMETRY_HISTOGRAM_BAND_UPPER_BOUNDS_MS = [
  50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000,
  60000,
] as const;

// One band per upper bound, plus the open-ended band above the last.
export const TELEMETRY_HISTOGRAM_BAND_COUNT = TELEMETRY_HISTOGRAM_BAND_UPPER_BOUNDS_MS.length + 1;
