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
