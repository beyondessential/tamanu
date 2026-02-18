# Agent: Performance

Focus: N+1 queries, unbounded `findAll`, expensive ops in loops, unnecessary React re-renders, missing indexes for new queries, large bundle imports, memory leaks, sync payload size impact, unbounded parallelism without concurrency limits (we have a finite DB connection pool).

Ignore: micro-optimisations, correctness, style, security.
