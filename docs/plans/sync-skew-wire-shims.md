# Cross-version sync via per-release wire shims

## Branches

- **`feat/sync/wire-shims`**: the shippable infrastructure stack. Plumbing only, with a small demonstration shim. Safe to merge under the `sync.allowVersionSkew=false` default flag.
- **`feat/sync/notes-skew-poc`**: a high-impact demonstration on top of the infra branch. Implements a real shim for migration `1759894448776-migrateNoteTypesToReferenceData` (~v2.41) so a pre-migration facility can sync with a current central. This is the migration that hurt in production, and the PoC proves the mechanism handles it cleanly.

## Context

Major upgrades cause cascading downtime: central upgrades → all facilities lose sync (the version gate rejects them) → each facility must be migrated → during migration the facility app can't run either. The previously-planned "best-effort read-only mode on facility during its own migration" addresses only the *second* downtime, is complex, and still leaves a sync outage during central's upgrade.

A better win is **skew-tolerant sync**: central can upgrade without taking facilities offline, and facilities upgrade on their own cadence within a defined window. We want this with reads *and writes*. The target window is **~3 months, i.e. up to 6 minor versions**.

This is independent of online facility-side migrations (still desirable, separate work).

## Audit findings: nearest wire-breaking migrations

A thorough audit going back 15+ minor releases turned up only three real wire-breakers on synced models:

| Migration | Approx version | Affected model | Shimmability |
|---|---|---|---|
| `1770250000001-makePatientOngoingPrescriptionIdDeterministic` | ~v2.48 (8 minors back) | PatientOngoingPrescription | **Hard** — id moved from random UUID to a deterministic composite; no way to reconstruct old ids on downcast |
| `1764037831379-renameInvoiceItemSavedFieldsAddPriceFinal` | ~v2.45 (11 minors back) | InvoiceItem | Clean — pure rename + drop, fits `renameField` + `removeField` combinators |
| `1761600704418-updateChangeTypeToArray` | ~v2.43 (13 minors back) | EncounterHistory | Clean — wrap/unwrap scalar↔singleton-array |
| `1759894448776-migrateNoteTypesToReferenceData` | ~v2.41 (15 minors back) | Note | Clean — closed 16-entry mapping, with `'other'` as a sensible fallback for unknown values |

The team's expand-contract discipline really shows here. **For the stated 3-month / 6-minor target there are zero wire-breakers.** The PoC focuses on the notes migration because (a) it caused real production pain, (b) it's the most demonstrative case (real value translation, not just a rename), and (c) all its mappings are deterministic and bounded.

## Direction (chosen)

**Per-release translation shims** between an "old facility" and a "new central":

- Wire schema is decoupled from app semver via a small integer **wire-schema version** that monotonically increments only when a sync-impacting migration lands.
- Facility declares its wire-schema version on each sync session via a new header.
- Central holds a **registry of shims** spanning the supported window. For each wire-schema bump, the shim defines `upcast` (old payload → new) and `downcast` (new payload → old) for the affected model(s).
- Outgoing pull from central: records are stamped at the current wire-schema, then downcast through the chain back to the facility's declared version before transmission.
- Incoming push from facility: records arrive at the facility's wire-schema, then upcast through the chain to current before persistence.
- Beyond the supported window, central rejects with a clear "upgrade required" error.
- **Facility-only first.** Mobile keeps the current strict gate; it gets the same treatment in a later phase.
- **Asymmetric**: only "old facility ↔ new central" is supported, not new-facility ↔ old-central. Rollback still requires reverting facilities to the prior version. This is a big simplification — only central needs the historical shim registry.
- **Breaking migrations are allowed** but must ship a shim. CI enforces this.

The win: 95% of migrations are wire-safe and need no shim. The rare wire-breaker (≈1/quarter from migration history) gets a tiny purpose-built function rather than forcing a global downtime.

## What the code already gives us

Verified from exploration:

- **One central gate to loosen**: `packages/shared/src/utils/buildVersionCompatibilityCheck.js`. Applied to all routes. We need to either bypass it for sync routes or replace it with a wire-schema-aware check on those routes.
- **The wire format is dynamic per query**: `packages/central-server/app/sync/snapshotOutgoingChanges.js` builds payloads with `json_build_object(...)` over `Object.keys(model.getAttributes())`. This is a natural insertion point for downcast.
- **Per-model hooks exist**: `Model.sanitizeForCentralServer` / `sanitizeForFacilityServer` (used today for things like `Asset` BLOB encoding and `User` password handling). These accept a record and return a transformed record — exactly the shape we need for shims.
- **String-typed enums** mean enum-value additions are wire-transparent (no shim needed).
- **DDL/DML separation** is already enforced. The codebase already prefers expand-contract over in-place rename (~1 rename in 90 recent migrations). Most migrations need no shim at all.
- **`sync_lookup.data`** stores the current shape; downcast happens at serve time, not in the cache. No cache-version explosion.

## Key design decisions

1. **Wire-schema version is independent of app semver.** A small integer, e.g. `WIRE_SCHEMA = 137`. Bumped by the developer who writes a wire-impacting migration; CI fails if a migration looks wire-impacting but doesn't bump it.

2. **Per-migration shims, grouped by wire-schema bump.** A migration that doesn't touch the wire bumps nothing. A migration that does bump exports a shim object alongside `up`/`down`. Multiple migrations within the same release naturally produce multiple bumps; the chain handles them.

3. **Per-session version negotiation, not per-record.** Facility declares its wire-schema version when opening the sync session (`POST /sync` request body), not via a per-request header. Central stamps it on the `sync_sessions` row and uses it for all push/pull traffic on that session. Bytes saved, no header proliferation, naturally scoped to a session's lifetime.

4. **Shims are functions, not declarative.** A small set of helper combinators (`defaultField`, `dropField`, `renameField`) covers the common cases; a free `(record) => record` escape hatch handles the rest.

5. **Apply at the boundary, not in the snapshot.** Outgoing: read snapshot in current shape, run downcast chain just before writing to the response. Incoming: run upcast chain just after reading from the wire, before `saveIncomingChanges` persists. Keeps the snapshot/lookup tables in canonical shape.

6. **Failure mode is loud and clean.** If the facility declares a wire-schema version outside the window, central returns a structured error with the supported range — same shape as today's `client-incompatible` error, different code.

## Files to touch

### New
- `packages/database/src/sync/wireShims.ts` — registry type, helpers (`defaultField`, `dropField`, etc.), `applyChain(direction, fromVersion, toVersion, model, record)`.
- `packages/shared/src/wireSchema.ts` — current `WIRE_SCHEMA` constant, `MIN_SUPPORTED_WIRE_SCHEMA` (window edge), `WireSchemaIncompatibleError`.
- A CI script under `scripts/` or `packages/build-tooling` that scans migrations and asserts shim coverage.

### Modified
- `packages/shared/src/utils/buildVersionCompatibilityCheck.js` — allow sync routes to opt out of the strict semver check (delegated to the wire-schema check) when the skew flag is on.
- `packages/central-server/app/sync/buildSyncRoutes.js` — gate behaviour on the skew feature flag. When on: read the facility's `wireSchema` from the `POST /sync` session-open request body, persist it on the `sync_sessions` row, return central's supported range in the session-open response, reject if facility's version is out of range. When off: existing behaviour unchanged.
- `packages/database/src/models/SyncSession.ts` — add a `wireSchemaVersion` column on `sync_sessions` so the version persists with the session and is available to all subsequent push/pull calls.
- `packages/central-server/app/sync/snapshotOutgoingChanges.js` — accept wire-schema target, apply downcast chain when emitting records (or wrap at the read-out point in the snapshot streaming code, depending on where it's cleanest). No-op when flag is off.
- `packages/database/src/sync/saveIncomingChanges.ts` — accept wire-schema source, apply upcast chain before `sanitizeFor*` and `bulkCreate`/`update`. No-op when flag is off.
- `packages/facility-server/app/sync/CentralServerConnection.js` — pass the facility's `wireSchema` in the session-open call body. Read the session-open response to detect out-of-window and surface a clear admin message ("this central no longer supports this facility's version; please upgrade to X").
- `packages/database/src/models/Model.ts` — typed `WireShim` interface; possibly thread version into `sanitizeFor*` signatures (optional; shims may be enough).
- Settings/config: register the `sync.allowVersionSkew` flag in the central server's config schema, default `false`.
- For the PoC: write shims for any wire-impacting migrations within the chosen 1–2 minor window. Most migrations will need none.

## Out-of-scope (explicitly)

- **Mobile.** Same wire-schema concept applies but mobile lags more and has its own TypeORM migration system. Tackle once the facility version is proven.
- **New-facility → old-central (rollback path).** Not supported; rollback still requires reverting the facility too. Mentioning explicitly because users may assume symmetry.
- **Online facility migrations** during the facility's own upgrade. Separate body of work, complementary.
- **The previously-planned "read-only mode" mitigation.** With shims in place it's optional; keep it as a fallback only if a future release genuinely cannot ship a shim (should be vanishingly rare).

## Risks

- **Shim correctness is the new failure mode.** A buggy shim is worse than a clean rejection: it silently corrupts records. Mitigation: each shim ships with round-trip tests (upcast(downcast(x)) ≈ x for fields that survive both ways) and the CI check verifies a representative sample.
- **Constraint-level breakage.** A new central `NOT NULL` or `UNIQUE` constraint can reject upcast records if the shim's default is wrong or the data really is invalid in the new model. The shim author must think about this; CI can flag new constraints to prompt review.
- **The shim chain length grows with window size.** 6 minors is not large; if shim count per minor stays ~1–2, chain is ~12 steps max. Each shim is O(fields touched). Performance is not a real concern at this scale.
- **Retroactive coverage.** If we want existing facilities at older versions to immediately benefit, we need to backfill shims for past migrations. Cheaper alternative: declare the window starts from version N (e.g. the version we ship the shim system in), and grandfather isn't supported.

## Feature flag

The whole skew mechanism sits behind a setting (e.g. `sync.allowVersionSkew`, default `false`). When off, the existing strict gate applies and nothing changes from a deployment's point of view. When on, the wire-schema negotiation kicks in and the supported window is enforced.

This lets us:
- Land the infrastructure safely without affecting any production deployment.
- Turn it on per-deployment in staging and pilot environments.
- Roll back instantly by flipping the flag if we hit unforeseen issues during a major upgrade.

The flag belongs on **central** (since central is the side that holds the shim registry and decides what to accept). Facility just always sends `X-Sync-Schema`; central ignores it when the flag is off.

## Phased rollout (revised: 1–2 minors PoC first)

1. **Foundations + PoC**: introduce `WIRE_SCHEMA`, header negotiation, shim infrastructure, CI scan, and the feature flag. Ship shims for **one or two minors** of skew. With the flag off, behaviour is unchanged. With the flag on, a 1–2-minor skew works end-to-end. This is one deliverable.
2. **Stage and validate**: enable the flag in staging/pilot, run real upgrades against held-back facility versions, exercise the round-trip integration tests in the skew matrix, fix issues found.
3. **Expand the window** to the target 6 minors, adding shims as releases land. Flip the flag on in production once the team is confident.
4. **Mobile** in a later phase, once the facility flow has burned in.

The PoC framing means the first deliverable is self-contained, low-risk, and demonstrates the approach end-to-end without committing to the full 6-minor window.

## Verification

- Unit tests per shim: `upcast` then `downcast` round-trip on representative records; field-level invariants.
- Integration test: spin up central at `WIRE_SCHEMA = N`, a facility client declaring `N-K`, run a full sync session (push + pull), assert records persist correctly on both sides.
- Skew matrix in CI: for each supported (central, facility) pair in the window, run the integration test.
- Manual smoke test against a real older release branch (e.g. `release/2.55`) talking to `main`.

## Decisions logged

- **Wire-schema version**: single monotonically-incrementing integer, separate from app semver. Passed in the body of the `POST /sync` session-open request (not a per-request header). Persisted on the `sync_sessions` row for the lifetime of the session.
- **PoC window**: 1–2 minor versions. Shims are backfilled for that window so the PoC has real-world coverage to test against. That floor becomes the declared minimum supported version once this ships.
- **Direction of compatibility**: old-facility ↔ new-central only. Rollback (new-facility ↔ old-central) still requires reverting facility versions.
- **Feature flag**: `sync.allowVersionSkew` on central, default off. Facility always declares its version; central ignores it unless the flag is on.
