{% docs fhir__table__job_workers %}
Worker registry for the FHIR job queue.

See the `fhir.jobs` table for more.

For workers to grab jobs from the queue, they first must register. Once a worker has registered, it
must "heartbeat" regularly by calling `job_worker_heartbeat()`. The recommended heartbeat time is
1/10th of the timeout, which is defined in the `public.settings` table at
`key=fhir.worker.assumeDroppedAfter`. A worker may also voluntarily deregister (e.g. during a
graceful shutdown).

When a worker fails to heartbeat for longer than the timeout, or when it deregisters, it is
considered "not alive". Jobs which were grabbed by a dead or no-longer-registered worker are
considered "dropped" i.e. back in the pool for other workers to grab.

This provides a system which is robust against restarts and failures without requiring a central
daemon to track and manage worker state, nor persistent connections from the workers (which is how
Gearman works).

The function `job_worker_garbage_collect()` should be called occasionally (e.g. once a day) to clean
out the table of dead workers.

Worker management is done via SQL functions: `job_worker_register()`, `job_worker_heartbeat()`,
`job_worker_deregister()`, `job_worker_garbage_collect()`. Additionally there's the querying
function `job_worker_is_alive()`.

This provides the possibility of decoupling part or whole of the job system from the Tamanu JS/TS
codebase, while retaining identical handling.
{% enddocs %}

{% docs fhir__job_workers__created_at %}
When the worker registered itself.
{% enddocs %}

{% docs fhir__job_workers__updated_at %}
Always set to `created_at`.
{% enddocs %}

{% docs fhir__job_workers__deleted_at %}
Unused: deregistered and dead workers are hard-deleted instead.
{% enddocs %}

{% docs fhir__job_workers__metadata %}
Arbitrary debugging information about the worker.
{% enddocs %}
