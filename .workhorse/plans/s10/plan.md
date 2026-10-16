# Move CD from the ops repo to the infra repo

Decisions: `beyondessential/infra` is the sole source of truth for `pulumi/`. Other parts of ops (ansible inventories etc.) keep being written in ops for now. Old branches are handled by backporting to supported release branches, not by mirroring.

## Findings

- Coupling is `.github/actions/setup-cd/action.yml` (hardcoded `repository: beyondessential/ops`, `ssh-key`, `ops/.node-version`, `npm ci` in `ops/pulumi`), `cd-up.yml` / `cd-down.yml` (`ops/pulumi/stacks/<opsstack>`), the `TAMANU_OPS_SSH` secret threaded through `cd.yml`, `cleanup-auto-deploy.yml`, `stale-auto-deploy.yml`, and the `opsref` / `opsstack` options in `packages/scripts/src/ghaCdHelpers.mjs`.
- `infra` has the same `pulumi/` layout and Pulumi project names, so existing stacks carry over. It has no `.node-version` (ops pins one).
- `if: inputs.ops-ssh-key` doubles as the "set up ops" flag. A public repo needs no key, so dropping the key without replacing the flag silently skips every ops step.
- Every branch runs its own copy of the CD files (push/PR). `issues`-driven deploys and the stale/cleanup schedules run from `main`.
- All 62 release branches from 2.6 to 2.67 hardcode the repo in exactly one place, the `repository:` and `ssh-key:` lines of `setup-cd`. `cd-up` / `cd-down` only use the `ops/` checkout path.
- `main`'s CD files are byte-identical to release/2.65 to 2.67 (and `setup-cd` to 2.63 and 2.64).
- Danger once ops freezes: branches still on `ops@main` redeploy stale Pulumi code over stacks `infra` has since changed.

## Steps

- [x] `infra`: add `.node-version` matching ops (`v24.4.1` at time of writing)
- [x] `main`: `setup-cd` checks out `beyondessential/infra` (no ssh key), explicit `with-infra` boolean replaces the key-as-flag, checkout path and node-version path become `infra/`
- [x] `main`: `cd-up` / `cd-down` use `infra/pulumi/stacks/<infrastack>`; stop passing `TAMANU_OPS_SSH` through `cd.yml`, `cleanup-auto-deploy.yml`, `stale-auto-deploy.yml`
- [x] `main`: add `infraref` / `infrastack` options in `ghaCdHelpers.mjs`, keep `opsref` / `opsstack` as accepted aliases so existing PR bodies keep working
- [x] `main`: `docs/` mentions of `beyondessential/ops` are all about host procedures (disk, restores, ansible inventories), which stay in ops, so they are left as they are
- [ ] Backport (`backport-infra-checkout.sh`, checked against all 12 branches, nothing pushed yet) to the supported release branches (2.43, 2.53, 2.54, 2.57, 2.60, 2.61, 2.62, 2.63, 2.64, 2.65, 2.66, 2.67; later releases are cut from `main`): minimal patch only, `repository: beyondessential/infra` and drop the `ssh-key:` line in `setup-cd`, keep the `ops/` path and input names so `cd-up` / `cd-down` need no change
- [ ] Keep the `TAMANU_OPS_SSH` secret defined (any non-empty value) until every backported branch has it
- [ ] Archive ops `pulumi/` as read-only only after the backports land; consider a guard in ops so nobody edits `pulumi/` there in the meantime

## Before merging

- `main` stops passing `TAMANU_OPS_SSH`; the secret stays defined for the backported branches

## Open

- Whether to remove `pulumi/` from ops or leave it frozen
