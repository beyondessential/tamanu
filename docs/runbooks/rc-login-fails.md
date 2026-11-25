# Runbook: cannot log in to a release candidate (RC)

Login on an RC (`release/2.xx` deployed to Kubernetes) fails, typically with an
invalid-credentials error for a default user such as `admin@tamanu.io`. How RCs are
deployed and where their state lives is in `../reference/rc-deployments.md`.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating.

## 1. When this applies

An RC, with credentials that should work, and a login that fails. The invalid-credentials
message can be misleading: when central is down, web login falls back to the facility
server (`../../llm/docs/authentication.md`), which has no such user. Confirm central is
actually serving before suspecting the password.

Not for a production deployment on Windows or Linux; start at `../deployment-context.md`.

## 2. Establish context

Namespace `tamanu-release-<major>-<minor>` on kubectl context `main`
(`../reference/rc-deployments.md#where-it-lives`). If `kubectl` cannot connect, see the
infra pack's `docs/sops/connect-to-k8s-cluster.md`. **[diagnose]**

## 3. Investigate

All steps **[diagnose]**; the first three need no judgement.

1. **Pods.** `kubectl --context main -n <ns> get pods`. Look at `central-api-*`:
   `Running 1/1` is healthy, `CrashLoopBackOff` or `0/1` is not, and a restart count in the
   hundreds means it has never come up.
2. **Endpoints.** `kubectl --context main -n <ns> get endpoints central-api`. An empty
   `ENDPOINTS` column means nothing is serving, whatever the web says.
3. **Why it dies.** `kubectl --context main -n <ns> logs deploy/central-api --previous`
   (or a pod name). The last `error` lines are the cause; the stack trace names the file.
4. **What the pod was given.** `kubectl --context main -n <ns> describe pod <pod>`, the
   `Environment:` block. Compare the variable names with what the code reads
   (`packages/shared/src/utils/authSecrets.js`, `packages/central-server/config/`).
5. **Argo CD.** `Synced` and `Degraded` means the render applied and a workload is
   unhealthy (the usual case here); `OutOfSync` or a render error is the infra pack's
   `docs/runbooks/application-out-of-sync.md` or `render-error.md`.
6. **If central is up**, check the user exists, read-only
   (`../sops/connect-psql.md`, **[sensitive-data]**):
   `select email, visibility_status from users where email like 'admin@%';`

## 4. Interpret

| Evidence | Diagnosis | Action |
| --- | --- | --- |
| Log: `Token signing secrets are missing or too weak: set AUTH_REFRESH_TOKEN_SECRET` | The renderer gave the pod the refresh secret under another name (`AUTH_REFRESH_SECRET`); 2.62+ reads `AUTH_REFRESH_TOKEN_SECRET` and 2.69 refuses to start without it | Fix in the infra renderer (`tamanu/on-k8s/renderer/src/central/specs.rs`), promote it, then hard-refresh the Application. See below |
| Log names another missing or misnamed variable | Same class of mismatch between renderer and code | Find the read in this repository and the env entry in the renderer; fix in infra |
| Log is a database or migration error | Not a login problem | `database-not-coming-up` or `hook-job-failed` in the infra pack |
| Pods `0/0`, or `downscaler/force-downtime` set | Deployment is hibernated | Infra pack `docs/sops/wake-deployment.md` |
| central-api `Running 1/1`, login still fails | A real credentials problem | Seeded data can differ from the provisioning template. Check step 6; escalate if the user is absent or deactivated |
| central login works, facility login fails | Facility sync not set up or not syncing | `sync-facility-stale.md`, and the `facility-N-setup-sync` Job's logs |

## 5. Resolve

- **Renderer mismatch.** The fix is a change to the infra repository, and the RC picks it
  up once the renderer build is promoted and the Application re-rendered (infra pack:
  `docs/sops/promote-renderer-channel.md`, `docs/sops/hard-refresh-application.md`).
  **[dev-OTS]**
- **Do not hand-patch the Deployment** (`kubectl set env`, `kubectl edit`) as the fix:
  Argo CD self-heals the Application and reverts it. A patch is only a short-lived
  diagnostic, and **[dev-OTS]**.
- **Never delete or recreate the RC's namespace, database or Application** to recover. It
  is long-lived and its data is a rehearsal of the release (`../ruled-out-actions.md`).

## 6. Escalate

Escalate to a developer when the cause is a renderer/code mismatch you cannot fix, or a
user is missing from the seeded data. Hand over: the RC and version, the exact `error`
log lines, the pod `Environment:` names, the Argo CD sync and health status, and which
step in section 4 matched.
