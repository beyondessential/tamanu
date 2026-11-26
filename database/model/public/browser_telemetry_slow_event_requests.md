{% docs table__browser_telemetry_slow_event_requests %}
Every API request made while a slow navigation was loading, kept with that [slow event](#!/source/source.tamanu.tamanu.browser_telemetry_slow_events) so the request that held the page up can be identified (spec: BTAG). Pushed from facilities to central and kept indefinitely.
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__slow_event_id %}
The [slow navigation](#!/source/source.tamanu.tamanu.browser_telemetry_slow_events) this request was made under.
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__span_id %}
OpenTelemetry span id of the request in the raw telemetry.
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__route %}
Endpoint route pattern of the request, as recorded by the browser.
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__method %}
HTTP method of the request.
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__status_code %}
HTTP response status. Null when the request got no response or was cut off.
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__outcome %}
Set to the navigation's outcome (`abandoned` or `capped`) when the request was still in flight as the navigation ended and was cut off; its duration is then truncated. Null otherwise.
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__duration_ms %}
Latency of the request in milliseconds.
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__start_offset_ms %}
When the request started, in milliseconds after the navigation started.
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__path_parameters %}
Values of the endpoint pattern's path parameters (record ids).
{% enddocs %}

{% docs browser_telemetry_slow_event_requests__query_parameter_names %}
Names of the request's query parameters. Their values are never kept.
{% enddocs %}
