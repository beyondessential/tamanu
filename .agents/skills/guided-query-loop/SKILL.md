---
name: guided-query-loop
description: "Run a live investigation as an operator-driven query loop: the operator runs each query on the live system and pastes the result back, and you guide the investigation one labelled query at a time. Use alongside support-assist (which covers what to investigate) whenever someone is pasting query or command output back from a deployment, especially during an incident. Covers labelling, pacing, making each query decide the next step, version-grounding, and keeping queries cheap and correctly classified."
label: "Guided query loop"
---

## Your task: guided query loop

The operator has access to a live system and you don't. They run what you suggest and paste the output back, and you read it and choose the next step. `support-assist` covers *what* to investigate. This skill covers *how* to run the loop so the operator always knows where they are.

### Start with a quick walkthrough

Open the session with a short walkthrough so the operator knows how the loop works, then wait for their reply before suggesting anything else:

> Start a read-only database session on the server with `bestool t p` (`bestool tamanu psql`). Tell me the problem, and I'll give you queries to run, each with a tag attached. Copy each result back here, including the tag. To practise, run this one and paste the result with its tag:
>
> ```sql
> SELECT 1 + 1;
> -- A0
> ```
>
> Say "skip" if you already know how this works.

`bestool t p` is read-only by default, which is what you want, since every query is suggested by you. bestool psql is its own client, not standard psql. Before suggesting meta-commands, write mode (`-W`, `\W`, explicit `COMMIT;`) or snippets, check `docs/sops/connect-psql.md` and the [bestool psql README](https://github.com/beyondessential/bestool/blob/main/crates/psql/README.md). For deployments without bestool, such as Kubernetes, `connect-psql.md` has the alternative.

If they paste the result, confirm it came through with its tag and ask for the problem. If they say skip, go straight to the problem. If the operator has already described the problem, still show the walkthrough, but keep it to those few lines.

### Pacing

- **One query per reply**, with a short read of the last result: what it showed and what it rules in or out. No batches of queries.
- **No long explanations between results.** Only include background when it changes what the operator should do next.
- **Keep your own queue** of checks still to run, and bring them up one at a time in priority order. Re-rank the queue when a result changes the picture, rather than working through a list fixed at the start.
- If the operator asks for a different format or pace, switch to it straight away and keep to it for the rest of the session.

### Labels

- **Each line of investigation gets a letter; each query in it gets a number:** A1, A2, B1… The first time a letter is used, say in one line what question it covers (for example "A: failing and retrying, or just slow?").
- **Labels stay stable for the whole session. Numbering never resets.** A corrected query keeps its number, so a fix to A1 is still "A1, fixed". A re-run of a query keeps its label too.
- **Put the label as a comment after the final `;`**, so the operator can copy the query and its result together in one selection:

  ```sql
  SELECT ...
  FROM ...;
  -- A1
  ```

- When a result comes back, refer to it by its label.

### Every query is a test

Before suggesting a query, know what each possible result would mean for the next step, and say so in a line or two: "if X, it's case 1 and we go to B2; if Y, it's case 2 and we check A3". Don't suggest a query whose result wouldn't change the next step.

### Ground in the deployed version

- **Get the deployment's version first** (from Canopy or the pack's `docs/deployment-context.md`), and read that version's code with `git show vX.Y.Z:<path>`, not main. Behaviour, schema and table names can differ between releases, sometimes a lot.
- **Check column types and the schema before using type-specific operators or functions.** Look at the model, migration, or `database/model/` yml at that version. A worked example: `logs.debug_logs.info` is `json`, not `jsonb`, so `info ? 'error'` fails with `operator does not exist: json ? unknown`. `info->>'error' IS NOT NULL` works for either type.
- When a query does fail, fix it under the same label, point out what was wrong in one line, and move on.

### Keep it cheap on a loaded system

- Assume the system is already struggling. Prefer indexed counts, `pg_stat_*` and `pg_class` estimates, and short `LIMIT`s over full scans.
- **Use `EXPLAIN` without `ANALYZE`** to see a plan. `EXPLAIN ANALYZE` actually runs the query.
- Warn the operator before any query that's expensive but worth running (for example, counting across many large tables), and offer a narrower version.
- **Flag anything that isn't read-only**, even something as low-risk as `ANALYZE`. Label it and give its classification.

### Classify and gate

Classify every suggested action on the support pack's ladder (`docs/README.md`), and treat `docs/ruled-out-actions.md` as a hard filter, following the rules in `support-assist`. The classification goes on the same line as the label, for example `-- C1 [approved-mitigation]`.

### Timezones

When the operator, the deployment and the data use different timezones, convert them explicitly once, near the start (for example "site is UTC+12, you are on NZDT (UTC+13), database timestamps are UTC"). After that, state which timezone each time is in. Take DST into account for the actual date.

### Example (condensed)

A central server's sync lookup build wasn't committing, so facility pulls were stale.
- A1 (attempt history) showed the same `since` cursor on every attempt since a known time, which meant retries of the same work, each failing with a serialisation error.
- A2 compared the build's start time with its transaction start and ruled out time spent waiting for other writes to commit.
- A3 checked for other writers on the table, and found none now.
- B1 and B2 showed it was on a table with only 55 pending rows but had spent 27 minutes reading from disk, so the next step was an `EXPLAIN` of that statement's shape (B3), not waiting longer.

Each query decided the next one, and the labels let the operator paste results back with no extra explanation.
