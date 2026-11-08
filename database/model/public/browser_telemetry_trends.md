{% docs table__browser_telemetry_trends %}
Browser performance telemetry rolled up per page or endpoint per time bucket (spec: BTAG). Each row summarises every navigation or API request for one route in one bucket on one server, keyed by interface, facility, kind, route, method and application version. Rows are produced by a scheduled rollup on each server holding raw telemetry (logs.browser_telemetry_spans), pushed from facilities to central, and kept indefinitely. The id is derived from the row's key, so rolling a bucket up again replaces the row.
{% enddocs %}

{% docs browser_telemetry_trends__bucket_start %}
Start of the time bucket, on a fixed boundary measured from midnight UTC. Spans are bucketed by when the server received them, not the browser-reported time.
{% enddocs %}

{% docs browser_telemetry_trends__bucket_minutes %}
Length of the bucket in minutes. Rows rolled up before a change to the bucket size keep the size they were rolled up with.
{% enddocs %}

{% docs browser_telemetry_trends__interface %}
Web client the events came from: `clinical`, `admin` or `patient-portal`.
{% enddocs %}

{% docs browser_telemetry_trends__facility_id %}
Primary facility of the server that received the events. Null for rows rolled up on central (admin panel and patient portal).
{% enddocs %}

{% docs browser_telemetry_trends__kind %}
`navigation` (a page load) or `request` (an API request).
{% enddocs %}

{% docs browser_telemetry_trends__route %}
Route pattern the events were grouped by, exactly as recorded by the browser: the page pattern for a navigation, the endpoint pattern for a request.
{% enddocs %}

{% docs browser_telemetry_trends__method %}
HTTP method of the requests. Null for navigations.
{% enddocs %}

{% docs browser_telemetry_trends__app_version %}
Application version of the web client that produced the events.
{% enddocs %}

{% docs browser_telemetry_trends__event_count %}
Number of events in the bucket for this row.
{% enddocs %}

{% docs browser_telemetry_trends__successful_count %}
Requests that received a response with a status below 400.
{% enddocs %}

{% docs browser_telemetry_trends__client_error_count %}
Requests that received a 4xx response.
{% enddocs %}

{% docs browser_telemetry_trends__server_error_count %}
Requests that received a 5xx response.
{% enddocs %}

{% docs browser_telemetry_trends__no_response_count %}
Requests that failed before a response arrived.
{% enddocs %}

{% docs browser_telemetry_trends__cut_off_count %}
Requests still in flight when the navigation they belonged to was abandoned or capped. Their durations are truncated, so they are left out of the duration statistics.
{% enddocs %}

{% docs browser_telemetry_trends__settled_count %}
Navigations that settled normally.
{% enddocs %}

{% docs browser_telemetry_trends__capped_count %}
Navigations ended by the hard time cap. Included in the duration statistics at their capped duration.
{% enddocs %}

{% docs browser_telemetry_trends__abandoned_count %}
Navigations the user left before they settled. Left out of the duration statistics.
{% enddocs %}

{% docs browser_telemetry_trends__timed_count %}
Events included in the duration statistics: every request not cut off, and every settled or capped navigation. Equals the sum of duration_histogram.
{% enddocs %}

{% docs browser_telemetry_trends__total_duration_ms %}
Sum of the durations of the timed events, in milliseconds, so a mean can be computed across any set of rows.
{% enddocs %}

{% docs browser_telemetry_trends__duration_histogram %}
Counts of timed events per duration band. The bands have inclusive upper bounds of 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000 and 60000 ms, then a final band for anything slower. The bands never change, so rows can be summed to compute percentiles over any range.
{% enddocs %}

{% docs browser_telemetry_trends__p50_duration_ms %}
Median duration of the timed events in this bucket (nearest-rank). Null when no events were timed. Cannot be combined across rows; use duration_histogram for that.
{% enddocs %}

{% docs browser_telemetry_trends__p95_duration_ms %}
95th percentile duration of the timed events in this bucket (nearest-rank). Null when no events were timed.
{% enddocs %}

{% docs browser_telemetry_trends__p99_duration_ms %}
99th percentile duration of the timed events in this bucket (nearest-rank). Null when no events were timed.
{% enddocs %}

{% docs browser_telemetry_trends__max_duration_ms %}
Longest duration among the timed events in this bucket. Null when no events were timed.
{% enddocs %}
