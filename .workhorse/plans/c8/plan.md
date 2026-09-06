# C8: pglite single-threaded performance bottleneck in DataTrak

Investigation notes. DataTrak web lives in the Tupaia repo (`beyondessential/tupaia`, `packages/datatrak-web`), not in Tamanu; this card only records the findings. Code references below are to Tupaia `dev` as of 3 September 2026 (`fda76de6a`) unless stated.

## Verdict

The bottleneck is real and is partly, not fully, resolvable.

- **Single connection is architectural and stays.** PGlite runs Postgres in single-user mode: one backend, one statement at a time, one transaction at a time. No configuration, version, or worker changes that. The only "multi-connection" feature PGlite offers (the 0.4 connection multiplexer) still serialises onto that one backend.
- **Single-threaded is DataTrak's choice, and is fixable.** Today the PGlite instance runs on the browser UI thread, so every query blocks rendering and every render delays queries. Moving it into a Web Worker removes that coupling. Chris has a working prototype of this on branch `tup-3193-test-3`.
- **The worker alone does not make large initial syncs succeed on the Galaxy Tab A7.** Andrew tested the worker branch and `dev` on that device and both failed to finish syncing STRIVE PNG (TUP-3208). The remaining causes are the IndexedDB filesystem's write amplification and memory footprint, and a sync design that holds the one connection inside one long transaction. Those are also fixable, but each is a separate piece of work.

## How DataTrak uses pglite today

- `packages/datatrak-web/src/database/getConnectionConfig.ts`: `new PGlite('idb://datatrak-db')` on the main thread, no worker, no `relaxedDurability`. pglite `^0.3.15`; latest is 0.5.8.
- `knex-pglite` 0.13 forces knex `pool: { min: 1, max: 1 }` and forwards every knex query to `pglite.query()`. It has no transaction integration: knex issues `BEGIN`/`COMMIT` as ordinary queries.
- Sync (`src/sync/ClientSyncManager.ts`) also runs on the main thread: the fetch stream is parsed, snake-cased, chunked and written from the UI thread. Progress is emitted per batch through a `mitt` emitter that several React hooks subscribe to.

## Four mechanisms that compound

### 1. UI thread starvation

Postgres WASM executes synchronously inside `pglite.query()`. While a 1000-row insert or a big select runs, React cannot paint or handle taps. On a Snapdragon 662 with 3 GB RAM those queries are slow enough that taps queue up for seconds. This is TUP-3198 (exit button lag, double-tap re-enters the sync page), TUP-3200 (home button takes about 25 s), and the "several seconds of nothing" after Log in in TUP-3207.

### 2. The one connection is held by long transactions

`saveIncomingChanges` requires a transaction, and the client wraps the **whole initial pull** in one knex transaction (`pullInitialSync`), and the whole persist stage of an incremental pull in another (`pullIncrementalSync`). knex has one pooled connection, so any UI query issued during that window waits for the pool. knex's default `acquireConnectionTimeout` is 60 s, after which it throws the error shown in every screenshot on TUP-3192, TUP-3199 and TUP-3208:

```
Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) call?
```

`hasOutgoingChanges`, the home page's top surveys and submission history, project switching and login all go through that pool, which is why they freeze for tens of seconds and then error while a sync is persisting. The 30-second sync loop also calls `queryClient.invalidateQueries()` with no filter after any pull, so every mounted query refetches into the same single connection at once.

A worker does not change this. The queue simply moves off the UI thread; the queries still wait, and knex still times them out at 60 s.

### 3. IndexedDB filesystem write amplification

The `idb://` filesystem is Emscripten IDBFS over an in-memory filesystem. On `syncToFs` it compares per-file mtimes and rewrites **each changed file in full** as one IndexedDB record. PGlite calls `syncToFs` after every query unless the query ran inside PGlite's own `transaction()` helper. knex-pglite never uses that helper, so PGlite's `#inTransaction` flag is never set and **every statement inside a knex transaction triggers a full flush of every dirty relation file, index file and WAL segment**. Cost per statement scales with table size, which is why small projects (Explore) work and STRIVE PNG does not, and why the same device gets progressively worse as the local database grows.

PGlite's own benchmarks put a small insert at about 21 ms on `idb://` versus 0.06 ms in memory and 0.085 ms with `relaxedDurability`, and that is for a tiny database. `relaxedDurability: true` makes the flush fire-and-forget and coalesces pending flushes, which removes most of the per-statement cost. Jasper's July audit (branch `doc/datatrak-web-offline-performance-audit`) and Chris's branch both reach for it.

Caveat Chris documented in `pglite.worker.ts` on `tup-3193-test-3`: with relaxed durability on during first-run `initdb`, the data directory can be persisted half-written, and PGlite then "resumes" a broken cluster forever (`language "plpgsql" does not exist`). It has to be enabled only after a first startup has completed.

### 4. Memory footprint scales with database size

IDBFS loads **every database file into WASM memory at startup** and keeps it there; IndexedDB holds a second copy; the sync path holds 10 000-record batches of JSON plus the knex query objects for them; the sync page rerenders per batch. Chrome on Android gives a tab well under the 3 GB of device RAM. The "Aw, Snap!" crash in TUP-3208 is the tab being killed, and it only happens while watching the sync page because those rerenders are the last straw. pglite issue #467 ("Failed to read large IndexedDB value" on Android Chrome) is the same storage tier hitting limits.

The OPFS access-handle-pool filesystem (`opfs-ahp://`) reads and writes at block offsets straight to disk, so resident memory becomes Postgres's own buffers rather than the whole database. It is worker-only, which is a second reason the worker move matters. It is Chrome and Firefox only (Safari lacks the sync access handle capacity), same as `idb://` today, so no browser support is lost.

## What has been tried

| Where | What | Outcome |
| --- | --- | --- |
| Chris, Feb 2025, `feature/test-pglite-performance` | Load tester comparing pglite vs Postgres for DataTrak queries (TUP-2270) | Chosen as viable for the offline build |
| Chris, May 2026, PR #6779 (merged) | Entity query performance (TUP-1648) | Merged |
| Chris, Jul–Aug 2026, PRs #6885, #6945, #6946, #6991, #6995 (all open or closed, none merged) | Survey submit performance (TUP-3193): PGlite in a dedicated worker, `relaxedDurability`, startup log capture, staged loading screen, then upgrade to pglite 0.5.5 | Worker prototype works; Andrew reports STRIVE PNG initial sync still fails on the Tab A7 on this branch |
| Jasper, Jul 2026, `doc/datatrak-web-offline-performance-audit` | Seven-item audit: service worker not caching the 8.5 MB wasm and 4.7 MB data bundle, `relaxedDurability`, autocomplete debounce, scoped invalidation, skip idle sync cycles, 6 MB dead JS, PGlite in a worker | Doc only, not merged |

None of the sync-side changes (shorter transactions, persisting outside a transaction, OPFS) has been tried.

## What is resolvable, and how

Ordered by leverage. Items 1 to 3 are all needed before a large-project initial sync can be expected to finish on the Tab A7; items 4 and 5 are cheap wins that reduce steady-state jank.

1. **PGlite in a dedicated worker**, starting from Chris's `tup-3193-test-3`. Fixes mechanism 1. Prerequisite for OPFS. Wrinkles Chris already solved: Vite worker bundling with the pglite externals, `?url` imports of wasm and data assets, `initdb.wasm` in 0.4+, TIMESTAMP parser must be set inside the worker, worker logs must not go over the PGliteWorker handshake channel. Multi-tab leader election comes for free.
2. **Switch the filesystem to `opfs-ahp://`.** Fixes mechanisms 3 and 4 structurally. No in-place migration from `idb://`: pglite issue #874 shows opening old data with a new build can trap the WASM runtime, so treat it as a fresh database under a new name, wipe the old IndexedDB store, and rely on the existing wipe-and-resync flow (the unsynced-data guard already protects local edits). Combine with the pglite upgrade to 0.5.x so the format change happens once.
3. **Stop holding the single connection inside one long transaction during sync.** Persist in bounded transactions (per model, or per few thousand rows) with a resumable cursor in `local_system_facts`, so that a UI query never waits more than one batch, and a crash mid-persist resumes rather than restarts. The deferred-constraint trick in `withDeferredSyncSafeguards` currently relies on the single transaction; per-batch transactions would need parent-before-child ordering (already available via `sortModelsByDependencyOrder`) or a final constraint pass. Also raise knex's `acquireConnectionTimeout` or, better, put the UI on a small priority queue in front of the connection so reads jump ahead of sync writes. This is the piece that no pglite feature can substitute for.
4. **`relaxedDurability: true`, gated on first-start having completed**, exactly as Chris's branch does. Large win on the current `idb://` filesystem while item 2 is pending; harmless once on OPFS.
5. **Jasper's audit items 1, 3, 4, 5**: precache the wasm and data bundles in the service worker, debounce the autocomplete search, scope post-sync invalidation to the record types pulled, skip idle sync cycles with the `EXISTS` pre-check that already exists.

Not recommended: replacing PGlite with SQLite WASM. It is also single-writer, would be a rewrite of `@tupaia/database`'s Postgres SQL (which is shared with the server), and TUP-2301 already chose PGlite for that reason.

## Open questions

- How large is the STRIVE PNG local dataset in rows and in on-disk bytes after initial sync? Needed to size OPFS and to decide batch sizes. Can be read from a completed sync on a desktop browser (`pg_database_size` and per-table `pg_total_relation_size`).
- Was Chris's Tab A7 failure on `tup-3193-test-3` a tab crash or a knex timeout? The Slack thread (C01JD93J4E6, 1785382593.841499) has the detail; Linear only has Andrew's summary.
- Should the worker also own the sync loop (fetch, parse, persist) so that the UI thread does none of it? Natural once the database is in a worker, but a larger refactor of `ClientSyncManager` and the React hooks that observe it.
