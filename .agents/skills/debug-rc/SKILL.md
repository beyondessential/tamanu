---
name: debug-rc
description: "Debug a Tamanu release candidate (RC) deployment running on Kubernetes: login failing or invalid credentials on an RC, pods crash-looping or not ready, an RC that is down, stuck, not syncing, or behaving differently from the release branch. Use when asked to debug, check, look at, or fix 'the RC', 'RC 2.69', 'the release candidate', 'release-2-69', or a namespace like tamanu-release-2-69. Covers how RCs are deployed, reading them with kubectl, and finding the cause in the infra repository's renderer. Not for production deployments (see support-assist) or PR preview deployments' own lifecycle."
label: "Debug RC"
category: other
---

## Your task: Debug an RC

An RC is a long-lived Kubernetes deployment of a `release/2.xx` branch. Pods are produced
by the **infra repository's renderer**, not by this repository, so a fault is as likely to
be a mismatch between the two as a bug in Tamanu. Work out which.

Unlike production, an RC is a non-production test environment, so you may run
**read-only** `kubectl` yourself. Anything mutating needs the user's go-ahead first.

### 1. Orient

Read `docs/reference/rc-deployments.md`: how an RC is made, its names (cluster context
`main`, namespace `tamanu-release-<major>-<minor>`, Argo CD Application of the same name in
`argocd-system`), its default login, and where the infra repository's pages are. If the
symptom is a login failure, follow `docs/runbooks/rc-login-fails.md`, which is the worked
example of this method.

If the user names only a version ("RC 2.69"), the namespace is `tamanu-release-2-69`.

### 2. Get the infra repository

Look for a sibling checkout (`../infra`). If it is absent, clone
`github.com/beyondessential/infra` into a scratch directory and read it there, rather than
paging its files over the network. Its `docs/` is a support
pack: use its `README.md` index, `docs/deployment-context.md`, and the runbook that matches
the symptom (crash-looping hook jobs, render errors, stuck Applications, hibernation).
Run `jj`/`git` there only to read, and match the revision Argo deployed
(`spec.source.targetRevision` on the Application) when it matters.

### 3. Follow the evidence, outside in

1. `kubectl --context main -n <ns> get pods`: what is not `Running` and ready, or has
   high restarts. Hook Jobs show `Completed` when healthy.
2. `logs --previous` and `describe pod` on the failing pod: the last error line, and the
   `Environment:` names it was given.
3. The Argo CD Application (`argocd-system`): sync, health, `PARAMS` (image tag, version,
   config), and its `targetRevision`.
4. Ground the error in this repository's code. When the pod misses an env var, find where
   the code reads it and where the renderer sets it
   (`tamanu/on-k8s/renderer/src/central/specs.rs` and siblings in the infra repository).
   Check the Tamanu version a rename or new requirement landed in before choosing a fix,
   since the renderer serves many versions.

Prefer the cause behind a message over the message: an "invalid credentials" login can be
a dead central server.

### 4. Fix and report

- A renderer or template fault is fixed in the infra repository. Gate version-specific
  behaviour on the deployed version, as the renderer's existing helpers do, and run its
  tests. A fix there reaches the RC only after the renderer is promoted and the
  Application re-rendered.
- A code fault is fixed here, on the release branch, then propagated (see
  `hotfix-propagator`).
- Argo CD self-heals, so hand-patching a workload is reverted. Never delete or recreate the
  RC's namespace, database or Application.
- Report the cause with the evidence (log line, env names, code `file:line` on both
  sides), what you changed, and what is still needed to reach the RC.

If you learn something durable that the docs lack, add it to `docs/runbooks/` or
`docs/reference/rc-deployments.md` rather than only to this skill, following
`curate-support-docs`.
