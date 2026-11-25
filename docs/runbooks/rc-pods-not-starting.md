# Runbook: RC pods stay not ready or keep restarting during a rollout

After a deploy or a renderer promotion on a release candidate (RC), central or facility
`api` and `sync` pods stay `0/1`, or restart every minute or two, and the Argo CD
Application sits at `Progressing` or `Degraded`. How RCs are deployed, and how to read
their resource use, is in `../reference/rc-deployments.md`.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating.

## 1. When this applies

An RC whose pods are alive but never become ready, or that restart repeatedly with little
or nothing in their logs. An RC rolls several times in a row after a merge (the image
build and a renderer promotion each trigger a sync, and each sync quiesces the workloads,
runs the migrators, then resumes), so judge it only after the last roll has settled.

Not for a crash with a clear error line (`rc-login-fails.md`), nor for one facility that
stopped syncing (`sync-facility-stale.md`, `sync-restart-loop.md`).

## 2. Establish context

Namespace `tamanu-release-<major>-<minor>` on kubectl context `main`
(`../reference/rc-deployments.md#where-it-lives`). **[diagnose]**

## 3. Investigate

All steps **[diagnose]**.

1. **Pods.** `kubectl --context main -n <ns> get pods`: note restart counts and which
   pods are not ready.
2. **How each restart happened.** `kubectl --context main -n <ns> describe pod <pod>`:
   under `Last State`, an exit code of 137 after about 90 seconds is a startup probe
   killing the container (60 one-second tries, then the termination grace period). A
   liveness kill shows `Liveness probe failed` in the events instead.
3. **What the logs say.** `kubectl --context main -n <ns> logs <pod> --previous`. A pod
   killed before it prints `Starting ... server version` was still loading modules.
4. **Whether it is starved.** `kubectl --context main top pod -n <ns>` shows CPU use. A
   pod that is not ready and uses a few percent of a core was waiting for CPU, not
   computing: CPU time over uptime from `/proc/1/stat` (fields 14 and 15, in hundredths
   of a second) inside the container says the same. Node load is in Prometheus
   (`../reference/rc-deployments.md#reading-resource-use`).
5. **Pods in `ContainerCreating` for minutes.** `kubectl ... get events --field-selector
   involvedObject.name=<pod>`: a `Pulling` event without a `Pulled` means the node is
   still fetching that image tag, which every node must do once per tag.

## 4. Interpret

| Evidence | Diagnosis | Action |
| --- | --- | --- |
| Exit 137 at about 90s, empty logs, CPU request `5m` on the container | Starved at start-up on a crowded node, then killed by the startup probe, which restarts the same slow boot | Fixed in the infra renderer (50m CPU and a five-minute startup budget for the API and sync servers, infra PRs #82 and #85). Needs that renderer promoted to the RC's channel (below) |
| `Liveness probe failed` on a `central-api` during a large pull | Probe allowed one second and two failures while a sync page kept the server busy | Same renderer fix (five seconds, six failures) |
| `ComparisonError` naming `central-seed-top-up-*` and an immutable `spec.template` | An older renderer named that Job by the image alone, so a changed pod spec cannot be applied to the existing Job | Fixed in the renderer (the name now follows the pod spec). On an older render, delete the completed Job so Argo recreates it **[dev-OTS]**; it reruns the top-up once |
| `ImagePullBackOff`, `NotFound` on `tamanu-synthetic-tests:sha-...` | The image for that commit is still being built by CD | Retries by itself; check the Tamanu `CD Synthetic Tests` run |
| Other `ImagePullBackOff` | Infra pack `docs/runbooks/image-pull-backoff.md` | |
| Application `OutOfSync` with hook Jobs running | A sync is mid-flight (quiesce, migrate, resume) | Wait for it; `Progressing` is expected |

## 5. Resolve

- A renderer change reaches the RC only once the `stable` channel is promoted and the
  Application re-rendered (infra pack: `docs/sops/promote-renderer-channel.md`). Promote
  with the commit left empty to take the latest renderer build from `main`; the run waits
  for that build. **[dev-OTS]**
- Do not hand-patch the Deployment or delete the RC's namespace, database or Application
  (`../ruled-out-actions.md`); Argo CD reverts patches.
- After the promote, wait for the whole chain to settle, then confirm: every pod ready,
  Application `Synced` and `Healthy`, central and both facilities accept a login, and the
  facility `sync` logs show `completedSession` with `pulling since=` rising.

## 6. Escalate

Escalate when pods still restart on a renderer that has the fixes above, or when nodes are
overloaded rather than the pods under-requesting (more than 100 pods on a 2 vCPU node).
Hand over: the RC and version, `describe` output for one restarting pod (exit code,
duration, events), its CPU request, and the Application's sync and health status.
