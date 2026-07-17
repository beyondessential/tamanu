# Runbook: sync pull page limit stuck low

A facility's sync pull is slow because the dynamic page-limit scaler has fallen
into a degenerate low loop. This is a performance problem, not an outright
failure, and has a concrete config fix.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating.

## 1. When this applies

Use this when the facility `sync` log shows the pull page limit oscillating
within a small band instead of scaling up, e.g.:

```
FacilitySyncManager.pull.pullingPage limit=52
FacilitySyncManager.pull.pullingPage limit=46
FacilitySyncManager.pull.pullingPage limit=38
FacilitySyncManager.pull.pullingPage limit=52
FacilitySyncManager.pull.pullingPage limit=46
FacilitySyncManager.pull.pullingPage limit=38
```

The limit keeps collapsing and never climbs — characteristic of the scaler stuck
in a low loop, which makes pulls needlessly slow.

## 2. Establish context

Which deployment, which facility, and its topology — `../deployment-context.md`.
Confirm the symptom by reading the facility `sync` log
(`../sops/read-logs.md`). **[diagnose]**

## 3. Resolve

Raise the dynamic limiter bounds in the facility `sync` config so the scaler has
room to climb. This is a **config change on the facility server**, so
**[dev-OTS]**.

```json5
"sync": {
  "dynamicLimiter": {
    "initialLimit": 1000,
    "minLimit": 100,
    "maxLimit": 10000,
    "optimalTimePerPageMs": 5000,
    "maxLimitChangePerPage": 0.2
  }
}
```

These values suit most servers and typically improve pull performance
dramatically (cited: on-call cheat sheet, "Sync pull page limit is not scaling
properly"). Apply, then restart the facility `sync` process so the config takes
effect (`../sops/restart-services.md`). `[inferred — dev to confirm]`: the source
gives the config block but does not state the restart-to-apply step explicitly —
a config change needs the process restarted to load it.

Confirm the limit now climbs by re-reading the `sync` log.

## 4. Escalate

If raising the limiter does not help, or pulls stay slow with no low-loop
pattern, treat it as a sync-performance investigation and escalate as in
`sync-facility-stale.md` §6 with a redacted payload.
