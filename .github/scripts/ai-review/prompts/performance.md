# Agent: Performance

Focus: N+1 queries, unbounded `findAll`, expensive ops in loops, unnecessary React re-renders, missing indexes for new queries, large bundle imports, memory leaks, sync payload size impact.

Also watch for unbounded parallelism — not just DB connection pool exhaustion, but anything that could produce very large payloads or fan out to many concurrent operations. Large collections should be batched and processed with bounded concurrency (e.g. `async-pool`).

Ignore: micro-optimisations, correctness, style, security.
