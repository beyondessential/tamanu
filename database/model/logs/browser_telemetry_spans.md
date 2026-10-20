{% docs logs__table__browser_telemetry_spans %}
Raw browser performance telemetry: one row per span. A span is either a page navigation (the root) or an API request made during it. Spans are captured in the web clients (clinical, admin, patient portal) via OpenTelemetry, batched, and posted to the server the client talks to, which stamps the facility and stores them here. The table is local to the server (does not sync, is not changelogged) and a scheduled task prunes rows past the retention horizon. Aggregation and reporting happen downstream.
{% enddocs %}

{% docs logs__browser_telemetry_spans__id %}
Primary key.
{% enddocs %}

{% docs logs__browser_telemetry_spans__created_at %}
Time the row was written to this table.
{% enddocs %}

{% docs logs__browser_telemetry_spans__updated_at %}
Time the row was last updated. Telemetry rows are write-once, so this matches created_at.
{% enddocs %}

{% docs logs__browser_telemetry_spans__deleted_at %}
Time the row was soft-deleted, if ever.
{% enddocs %}

{% docs logs__browser_telemetry_spans__trace_id %}
Identifier shared by every span of one navigation: the navigation root and all the request spans captured under it carry the same trace_id.
{% enddocs %}

{% docs logs__browser_telemetry_spans__span_id %}
Identifier unique to this span within its trace.
{% enddocs %}

{% docs logs__browser_telemetry_spans__parent_id %}
span_id of the parent span. Null for a navigation root and for a standalone request (one made outside any page load); set to the owning navigation's span_id for a request made while that page was loading.
{% enddocs %}

{% docs logs__browser_telemetry_spans__kind %}
What the span measures: `navigation` for a page load, `request` for an API request (whether made during a page load or on its own).
{% enddocs %}

{% docs logs__browser_telemetry_spans__route %}
Generic route pattern with identifiers replaced by placeholders (for a navigation, the page pattern; for a request, the endpoint pattern). This is the grouping key for aggregation; the concrete path is derivable from route plus parameters.
{% enddocs %}

{% docs logs__browser_telemetry_spans__parameters %}
Resolved values that the route pattern abstracts away, as a JSON object with `path` (the placeholder fillers) and `query` (query-string parameters) kept apart. May contain patient-identifiable values such as search terms, so it is anonymised downstream.
{% enddocs %}

{% docs logs__browser_telemetry_spans__method %}
HTTP method of a request span (e.g. GET, POST). Null for a navigation span.
{% enddocs %}

{% docs logs__browser_telemetry_spans__status_code %}
HTTP response status of a request span. Null for a navigation span, or when the request failed before a response arrived.
{% enddocs %}

{% docs logs__browser_telemetry_spans__duration_ms %}
Span duration in milliseconds: for a navigation, until the page settled (or was capped/abandoned); for a request, its round-trip time.
{% enddocs %}

{% docs logs__browser_telemetry_spans__outcome %}
How a navigation ended: `settled` once the network went quiet, `abandoned` if the user navigated away first, or `capped` if it hit the maximum duration. Null for a request span.
{% enddocs %}

{% docs logs__browser_telemetry_spans__interface %}
Which web client produced the span: clinical, admin, or patient portal. Stamped server-side from the ingest endpoint that received the batch (each is reached by exactly one interface) rather than reported by the client.
{% enddocs %}

{% docs logs__browser_telemetry_spans__device_id %}
Identifier of the device the client runs on. Captured for every span, including before sign-in.
{% enddocs %}

{% docs logs__browser_telemetry_spans__session_id %}
Identifier of the signed-in session the span belongs to. Null for spans captured before sign-in.
{% enddocs %}

{% docs logs__browser_telemetry_spans__app_version %}
Version of the web client that produced the span.
{% enddocs %}

{% docs logs__browser_telemetry_spans__user_id %}
Identifier of the signed-in user. Null for spans captured before sign-in.
{% enddocs %}

{% docs logs__browser_telemetry_spans__facility_id %}
Facility the span is attributed to, stamped server-side from the receiving server's own configuration rather than trusted from the client. Null when the server has no single facility (e.g. the patient portal's central server).
{% enddocs %}

{% docs logs__browser_telemetry_spans__occurred_at %}
Time the span occurred in the browser, as reported by the client.
{% enddocs %}
