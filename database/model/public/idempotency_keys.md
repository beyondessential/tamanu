{% docs table__idempotency_keys %}
Records the outcome of a mutating API request that carried an `Idempotency-Key`
header, so that a client retrying after a dropped connection receives the
original outcome instead of performing the operation a second time.

Operational state local to each server: never synced, and excluded from change
logging. Rows are deleted by a scheduled task once past `expires_at`.

The table exists on both central and facility servers, but only the facility
server currently records anything in it.
{% enddocs %}

{% docs idempotency_keys__key %}
The key the client sent in the `Idempotency-Key` header. Unique per user and
facility rather than globally, so the same key presented by a different user or
at a different facility is a different operation.
{% enddocs %}

{% docs idempotency_keys__user_id %}
The user whose request was recorded. Part of the key's scope.
{% enddocs %}

{% docs idempotency_keys__facility_id %}
The facility the request was made against. Part of the key's scope.
{% enddocs %}

{% docs idempotency_keys__method %}
HTTP method of the recorded request, e.g. `POST`.
{% enddocs %}

{% docs idempotency_keys__path %}
Request path the key was recorded against.
{% enddocs %}

{% docs idempotency_keys__request_hash %}
Fingerprint of the method, path and body. A key presented again with a different
fingerprint is a client error rather than a retry, and is rejected instead of
being answered with the recorded response.
{% enddocs %}

{% docs idempotency_keys__status %}
Whether the request is still running (`in_progress`) or its outcome has been
recorded (`completed`).
{% enddocs %}

{% docs idempotency_keys__response_status %}
HTTP status code of the recorded response.
{% enddocs %}

{% docs idempotency_keys__response_body %}
Body of the recorded response, returned verbatim to a retry of the same request.

May contain patient data, since it is whatever the original endpoint returned.
{% enddocs %}

{% docs idempotency_keys__response_content_type %}
Content type of the recorded response, so a replay reproduces the original rather
than assuming JSON.
{% enddocs %}

{% docs idempotency_keys__claimed_at %}
When the request claimed the key. Drives the lease that allows a claim abandoned
by a server crash to be taken again.
{% enddocs %}

{% docs idempotency_keys__completed_at %}
When the outcome was recorded. Null while the request is still running.
{% enddocs %}

{% docs idempotency_keys__expires_at %}
Retention horizon: the cleanup task deletes rows past this point, once the
client's retry window has passed.
{% enddocs %}
