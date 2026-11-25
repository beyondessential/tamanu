# Release candidate (RC) deployments

How a release candidate is deployed, where it lives, and where its state can be read.
Lookup material only: for a symptom, start from the runbooks, for example
`../runbooks/rc-login-fails.md`.

An RC is a long-lived Kubernetes deployment of a `release/2.xx` branch, used to rehearse
the release before it ships: its migrations run against the previous minor's data, and
QA and the synthetic tests run against it.

## How an RC comes to exist

1. The `Cut Release Branch` workflow (`.github/workflows/cut-release-branch.yml`) pushes
   `release/2.xx` and opens an `Auto-deploy: release/2.xx` control issue (label
   `auto-deploy`) whose body asks for `%config=rc %ttlhours=0 %seed-snapshot %synthetic`.
2. Tamanu CD (`.github/workflows/cd.yml`) builds the images on each push to the branch,
   then updates a Pulumi stack named after the branch, `release-2-xx`, in the infra
   repository (`pulumi/tamanu/on-k8s`).
3. Pulumi creates an Argo CD Application. Argo renders it with the infra repository's
   renderer (`tamanu/on-k8s/renderer`), which produces every Deployment, Job and Secret
   reference. **What the pods look like is decided by the renderer, not by this repository.**

Because of step 3, a pod that fails on a missing or misnamed environment variable is
usually a renderer problem fixed in the infra repository, even when the symptom is
in a Tamanu server.

## Where it lives

| What | Value for `release/2.69` |
| --- | --- |
| Cluster | `tamanu-internal-main`, kubectl context `main` |
| Namespace | `tamanu-release-2-69` (`tamanu-` plus the stack name) |
| Argo CD Application | `tamanu-release-2-69` in namespace `argocd-system` |
| Addresses | `central.release-2-69.cd.tamanu.app`, plus one host per facility |
| Config template | `rc`: label `bes.tamanu/template` on the Application |
| Facilities | Two, `facility-1` and `facility-2`, each with its own database |
| Data | Seeded from the newest snapshot of the previous minor, then topped up with generated data |
| Lifetime | No expiry (`ttlhours=0`). Treat as long-lived, never destroy |

Workloads follow a fixed naming scheme: `central-api`, `central-tasks`, `central-web`,
`central-db-N`, `facility-N-api`, `facility-N-sync`, `facility-N-tasks`, `facility-N-db-N`.
Hook Jobs (`central-migrator`, `central-provisioner`, `central-seed-top-up-*`,
`facility-N-migrator`, `facility-N-setup-sync`) show `Completed` when healthy.

## Logging in

The `rc` template provisions `admin@tamanu.io` with password `admin` (and role users such
as `medicalofficer@tamanu.io`, same password). The source is
`pulumi/tamanu/k8s-infra/templates/rc/provisioning.json5.njk` in the infra repository.
These are test credentials on a non-production deployment.

Web login tries central first and falls back to the facility server
(`../../llm/docs/authentication.md`). When central is down, the fallback usually answers
instead, with an invalid-credentials error. Check that central is up before suspecting
the password.

## Rollouts

The renderer channel (label `bes.tamanu/renderer-channel`, `stable` by default) moves only
when someone promotes it, so a merged renderer fix does not reach an RC until then.
A push to the release branch, a renderer promotion and a config change each start a sync
that quiesces the workloads, runs the migrators and resumes, so an RC can roll three times
in an hour. Treat a rollout as settled when the Application is `Synced` and `Healthy` and
every pod is ready; `../runbooks/rc-pods-not-starting.md` covers one that does not.

## Reading resource use

`kubectl --context main top pod -n <ns>` and `top node` work once metrics-server is
installed (`pulumi/k8s-essentials/metrics/`). History is in Prometheus in `metrics-system`,
reachable read-only through the API server proxy:

```
kubectl --context main get --raw "/api/v1/namespaces/metrics-system/services/prometheus-server:80/proxy/api/v1/query?query=<url-encoded PromQL>"
```

Use `/query_range` with `start`, `end` and `step` for a series. Useful series:
`container_cpu_usage_seconds_total` (labels `namespace`, `pod`, `container`),
`kube_pod_container_resource_requests{resource="cpu"}`, and `node_cpu_seconds_total`
(node-exporter).

The `instance` label differs between these jobs: on the cluster's own scrape config it is
the node name for container series and `[node IP]:9100` for node-exporter. To go from a
pod to its node's series, read `node` and `host_ip` from `kube_pod_info{pod="<pod>"}`,
then match `instance` to `node` for container series and to `[<host_ip>]:9100` for
node-exporter.
A container with no CPU limit has no CFS throttling series, so a pod starved of CPU by
its neighbours shows low use and a small request, not throttling.

## Infra repository

The renderer, templates and the Kubernetes support pack live in
`github.com/beyondessential/infra`. It is usually a sibling checkout (`../infra`); if
not, clone it. Its `docs/` is a support pack in the same shape as this one.

| Need | Infra page |
| --- | --- |
| Which deployment, and its state | `docs/deployment-context.md` |
| Connect `kubectl` | `docs/sops/connect-to-k8s-cluster.md` |
| Inspect an Application and its render | `docs/sops/inspect-application.md`, `docs/sops/inspect-render.md` |
| Read logs, restart services | `docs/sops/read-logs.md`, `docs/sops/restart-services.md` |
| Deployment asleep | `docs/sops/wake-deployment.md` |
| Seed snapshot behaviour | `docs/runbooks/seeded-deployment.md` |
| A migrator or hook Job failed | `docs/runbooks/hook-job-failed.md` |
| Config or template change not applied | `docs/runbooks/config-change-not-applied.md` |
| Renderer change not showing | `docs/runbooks/renderer-change-not-showing.md` |
