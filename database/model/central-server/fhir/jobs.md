{% docs fhir__table__jobs %}
Job queue for FHIR materialization.

Materialization for FHIR is handled by jobs issued on a queue (this table) and processed by workers.
Error state is preserved, but successful jobs are discarded.

The job system was loosely based on <https://gearman.org/>: it supports multiple workers, timeouts,
concurrency and uniqueness control, arbitrary payloads, and flexible prioritisation. Differences
include an integer priority instead of (high, normal, low) and the lack of return values.

Job management is done via SQL functions: `job_submit()`, `job_start()`, `job_complete()`,
`job_fail()`, `job_grab()`. Some additional functions are used for debugging: `job_backlog()`.

This provides the possibility of decoupling part or whole of the job system from the Tamanu JS/TS
codebase, while retaining identical handling.
{% enddocs %}

{% docs fhir__jobs__created_at %}
When the job was inserted into the queue.
{% enddocs %}

{% docs fhir__jobs__updated_at %}
When the job was updated (mostly due to status changes).
{% enddocs %}

{% docs fhir__jobs__deleted_at %}
Unused: successful jobs are hard-deleted instead.
{% enddocs %}

{% docs fhir__jobs__priority %}
Integer priority of the job. Higher numbers win.

The default is 1000.

Convention is to use hundreds in code (e.g. 1500 for "higher priority") and then increase/decrease
by tens or lower for manual priority management (e.g. 1010 to manually bump some jobs up).
{% enddocs %}

{% docs fhir__jobs__status %}
Lifecycle status of the job.

1. Starts at `Queued`
2. A worker grabs the job from the backlog, which transitions it to `Grabbed`
3. The worker starts working the job, transitioning it to `Started`
4. The worker completes the job, which deletes it from the queue
5. Or the worker fails the job, which sets its status to `Errored`
6. Or the worker drops the job, which puts it back into the backlog.

The backlog is defined as jobs that are `Queued` and/or that are `Grabbed`/`Started` but where the
recorded grabbing worker is "no longer alive" -- which occurs after a heartbeat timeout. See the
`fhir.job_workers` table.
{% enddocs %}

{% docs fhir__jobs__worker_id %}
ID of the worker which has grabbed this job for processing.
{% enddocs %}

{% docs fhir__jobs__started_at %}
Timestamp when the worker started processing the job.

This may be a while after the job is grabbed, though in general it's pretty immediate.
{% enddocs %}

{% docs fhir__jobs__completed_at %}
When the job was completed.

Rarely used as completed jobs are hard-deleted.
{% enddocs %}

{% docs fhir__jobs__errored_at %}
When the job failed.

This implies that `status=Errored` and the `error` field is not null.
{% enddocs %}

{% docs fhir__jobs__error %}
Description or stack trace of the error which caused the job to fail.
{% enddocs %}

{% docs fhir__jobs__topic %}
Jobs are organised along topics.

This is used to route jobs to job handlers.

A worker can choose which topics it will handle, and have different concurrency settings per topic.

In general it's expected that jobs with the same topic will use similar amounts of resources, and
present a fairly uniform workload.
{% enddocs %}

{% docs fhir__jobs__discriminant %}
Value used to deduplicate jobs.

By default this is set to a random value.

If a job is submitted with the same `discriminant` as a job that's already `Queued`, `Grabbed`,
or `Started`, the new job will be discarded. This can be used to enforce uniqueness or to prevent
redundant work.

When a job is failed, its discriminant is reset to a random value to avoid forbidding new jobs from
being submitted while keeping the error records around.

To make code easier discriminants are also enforced to be globally unique within the table, so it's
a good idea to prefix a fixed discriminant with the topic it's for.
{% enddocs %}

{% docs fhir__jobs__payload %}
Arbitrary JSONB payload.

The handlers for a particular topic interpret and enforce the schema of payloads, but the job system
itself doesn't care.
{% enddocs %}
