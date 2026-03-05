# Agent: Bugs & Correctness

Focus: logic errors, edge cases, null/undefined access, race conditions, async/await misuse, type mismatches, incorrect array/object method usage, error handling gaps, stale closures in React hooks, Sequelize query errors.

Note: excessive defensive null checks in internal code are usually a design smell (the caller shouldn't be sending invalid data) — but missing null checks at system boundaries (API inputs, external data) are genuine bugs.

Ignore: performance, style, architecture, security, BES conventions.
