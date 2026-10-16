// spec: BTEL
// Attribute keys carried on each OpenTelemetry span. OTel attributes must be
// primitives, so the nested `parameters` object is stored JSON-encoded under
// PARAMETERS and decoded again in the exporter.
export const SPAN_ATTR = {
  KIND: 'tamanu.kind',
  ROUTE: 'tamanu.route',
  PARAMETERS: 'tamanu.parameters',
  METHOD: 'tamanu.method',
  STATUS_CODE: 'tamanu.status_code',
  OUTCOME: 'tamanu.outcome',
  INTERFACE: 'tamanu.interface',
  DEVICE_ID: 'tamanu.device_id',
  SESSION_ID: 'tamanu.session_id',
  APP_VERSION: 'tamanu.app_version',
  USER_ID: 'tamanu.user_id',
};

export const TELEMETRY_TRACER_NAME = 'tamanu-browser';
