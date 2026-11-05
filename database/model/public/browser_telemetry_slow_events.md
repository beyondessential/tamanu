{% docs table__browser_telemetry_slow_events %}
The slowest browser telemetry events behind each trend row, kept in detail so an acute slowdown can be traced to the record, device or user involved (spec: BTAG). For each trend row the rollup keeps the slowest few events plus every event over the slow threshold for its kind, up to a cap. Path parameter values (record ids) are kept; query parameters keep only their names. Pushed from facilities to central and kept indefinitely.
{% enddocs %}

{% docs browser_telemetry_slow_events__trend_id %}
The [trend row](#!/source/source.tamanu.tamanu.browser_telemetry_trends) this event belongs to.
{% enddocs %}

{% docs browser_telemetry_slow_events__trace_id %}
OpenTelemetry trace the event belonged to in the raw telemetry.
{% enddocs %}

{% docs browser_telemetry_slow_events__span_id %}
OpenTelemetry span id of the event in the raw telemetry.
{% enddocs %}

{% docs browser_telemetry_slow_events__kind %}
`navigation` (a page load) or `request` (an API request).
{% enddocs %}

{% docs browser_telemetry_slow_events__route %}
Route pattern of the event, as recorded by the browser.
{% enddocs %}

{% docs browser_telemetry_slow_events__navigation_route %}
For a request made while a page was loading, the route pattern of that page. Null otherwise.
{% enddocs %}

{% docs browser_telemetry_slow_events__method %}
HTTP method of a request. Null for navigations.
{% enddocs %}

{% docs browser_telemetry_slow_events__status_code %}
HTTP response status of a request. Null for navigations and for requests that got no response.
{% enddocs %}

{% docs browser_telemetry_slow_events__outcome %}
How a navigation ended: `settled` or `capped`. Null for requests.
{% enddocs %}

{% docs browser_telemetry_slow_events__duration_ms %}
Page-load time of a navigation, or latency of a request, in milliseconds.
{% enddocs %}

{% docs browser_telemetry_slow_events__occurred_at %}
When the event started, as reported by the browser's clock.
{% enddocs %}

{% docs browser_telemetry_slow_events__received_at %}
When the receiving server stored the raw event.
{% enddocs %}

{% docs browser_telemetry_slow_events__interface %}
Web client the event came from: `clinical`, `admin` or `patient-portal`.
{% enddocs %}

{% docs browser_telemetry_slow_events__facility_id %}
Primary facility of the server that received the event. Null on central.
{% enddocs %}

{% docs browser_telemetry_slow_events__app_version %}
Application version of the web client.
{% enddocs %}

{% docs browser_telemetry_slow_events__device_id %}
Stable per-workstation identifier of the browser.
{% enddocs %}

{% docs browser_telemetry_slow_events__user_id %}
User signed in when the event happened. Null before sign-in.
{% enddocs %}

{% docs browser_telemetry_slow_events__path_parameters %}
Values of the route pattern's path parameters (record ids such as a patient or encounter id), so the event can be traced to the record it was for.
{% enddocs %}

{% docs browser_telemetry_slow_events__query_parameter_names %}
Names of the event's query parameters. Their values are never kept, as they can hold patient-identifying search terms.
{% enddocs %}
