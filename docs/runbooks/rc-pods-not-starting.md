# Runbook: RC workloads stay not ready or keep restarting during a rollout

After a deploy or a renderer promotion on a release candidate (RC), workloads stay
`0/1`, or restart again and again, and the Argo CD Application sits at `Progressing` or
`Degraded`. How RCs are deployed, and how to read their resource use, is in
`../reference/rc-deployments.md`.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating.

## 1. When this applies

An RC with workloads that do not become ready, or that restart repeatedly. An RC rolls
several times in a row after a merge (the image build and a renderer promotion each start
a sync, and each sync quiesces the workloads, runs the migrators, then resumes), so judge
it only after the last roll has settled.

Not for a crash with a clear error line (`rc-login-fails.md`), nor for one facility that
stopped syncing (`sync-facility-stale.md`, `sync-restart-loop.md`).

## 2. Establish context

Namespace `tamanu-release-<major>-<minor>` on kubectl context `main`
(`../reference/rc-deployments.md#where-it-lives`). **[diagnose]**

## 3. Investigate

All steps **[diagnose]**. The aim is to name the kind of failure before looking for its
cause, because each kind has a different owner.

1. **Pods.** `kubectl --context main -n <ns> get pods`: which are not ready, their status
   and restart counts.
2. **Why each one stopped.** `kubectl --context main -n <ns> describe pod <pod>`: the
   `Last State` reason and exit code, how long it ran, and the events. A kill by a probe
   shows `Reason: Error`, exit code 137 and a `Startup probe failed` or `Liveness probe
   failed` event; an out-of-memory kill shows `Reason: OOMKilled`; a crash shows an error
   exit with a log.
3. **What it logged.** `kubectl --context main -n <ns> logs <pod> --previous`. A server
   killed before its first log line was still loading.
4. **Whether it was starved.** `kubectl --context main top pod -n <ns>` and the CPU
   request in the pod spec. A pod that is not ready and uses a few percent of a core was
   waiting for CPU, not computing (inside the container, CPU time over uptime from
   `/proc/1/stat`, fields 14 and 15 in hundredths of a second, says the same). Node load
   is in Prometheus (`../reference/rc-deployments.md#reading-resource-use`).
5. **Pods not created or not pulled.** `ContainerCreating` for minutes, or
   `ImagePullBackOff`: `kubectl ... get events --field-selector involvedObject.name=<pod>`.

## 4. Interpret

| Evidence | Kind of failure | Next step |
| --- | --- | --- |
| Killed by a probe, little or no log, low CPU use against a small CPU request | Resource contention at start-up: the pod is starved on a crowded node and its probe budget runs out before it can boot, and each kill restarts the same slow boot | The fix is the pod's CPU request or probe budget in the infra renderer, not the application. Raise it there and promote (section 5); infra pack `docs/spec/kubernetes/tamanu/deployment-rollout.md#server-health` states the intended budgets |
| Killed by a liveness probe while the server was busy (large sync, migration) | A probe stricter than the work the server does | Same place: the renderer's probe settings |
| `Last State` reason `OOMKilled` | The container went over its memory limit | The memory request and limit in the renderer, or a leak in the application: compare `kubectl top pod` with the container's peak memory in Prometheus before choosing |
| Application `ComparisonError` naming an immutable field of a Job | A Job rendered as an ordinary resource keeps its name while the render changes its pod template, and a Job's template cannot change in place | A render must give the Job a new name when its template changes; until the renderer does, delete the completed Job so Argo recreates it **[dev-OTS]** |
| `ImagePullBackOff` with `NotFound` | The image for that tag is not built yet, or the build failed | Check the CD run for that commit; a build in progress retries by itself. Other pull failures: infra pack `docs/runbooks/image-pull-backoff.md` |
| `ContainerCreating` for minutes, then starts | The node is pulling that tag for the first time | Wait; many tags and many busy nodes make rollouts slow |
| Application `OutOfSync` with hook Jobs running | A sync is mid-flight | Wait for it; `Progressing` is expected |
| Pods `0/0`, or `downscaler/force-downtime` set | Deployment is hibernated | Infra pack `docs/sops/wake-deployment.md` |

## 5. Resolve

- A fix in the renderer reaches the RC only once the `stable` channel is promoted and the
  Application re-rendered (infra pack: `docs/sops/promote-renderer-channel.md`). Leave the
  commit empty to take the latest renderer build from `main`; the run waits for that
  build. **[dev-OTS]**
- Do not hand-patch the workload or delete the RC's namespace, database or Application
  (`../ruled-out-actions.md`); Argo CD reverts patches.
- After the rollout settles, confirm: every pod ready, Application `Synced` and
  `Healthy`, central and both facilities accept a login, and each facility `sync` log
  shows `completedSession` with `pulling since=` rising.

## 6. Escalate

Escalate when workloads still fail on a renderer that has the right requests and probe
budgets, or when the nodes are overloaded rather than the pods under-requesting. Hand
over: the RC and version, `describe` output for one failing pod (exit code, run time,
events), its CPU request and use, and the Application's sync and health status.
