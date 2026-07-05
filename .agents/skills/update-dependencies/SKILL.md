---
name: update-dependencies
description: >-
  Update npm/yarn/pnpm dependencies using manifest-first, lockfile-aware workflows. Prefer declared
  version bumps over resolution overrides. Use when updating, upgrading, or patching dependencies;
  fixing transitive dependency versions; addressing npm audit or CVE findings; or removing stale
  overrides.
---

# Update Dependencies

Package-manager agnostic workflow for bumping dependencies safely in monorepos and single-package
repos.

## Core rule

**Avoid overriding resolutions.** Always prefer updating the declared dependency version in the
manifest (`package.json` or equivalent).

## Detect the package manager

Check, in order:

1. `packageManager` field in the root manifest
2. Lockfile present: `package-lock.json` (npm), `yarn.lock` (Yarn), `pnpm-lock.yaml` (pnpm),
   `deno.lock` (Deno), `bun.lockb` (Bun)
3. Fallback: ask the user

Use that manager's install and dependency-inspection commands throughout.

| Task                | npm               | Yarn                           | pnpm            |
| ------------------- | ----------------- | ------------------------------ | --------------- |
| Install             | `npm install`     | `yarn install`                 | `pnpm install`  |
| Why is X installed? | `npm explain pkg` | `yarn why --recursive pkg@ver` | `pnpm why pkg`  |
| List tree           | `npm ls pkg`      | `yarn why pkg`                 | `pnpm list pkg` |

## Scope: one dependency per PR

Prefer **one dependency bump per PR** (or a small cluster when deps must move together, e.g. React +
react-dom, or a plugin + its host package).

Before starting, check whether an existing override/resolution already pins the dependency. Consider
removing it in favour of steps 1–3 in the update cascade below.

## Update cascade (descending preference)

Follow this order. Stop as soon as the target version is satisfied.

### 1. Direct dependency — update the manifest

If the dependency is declared in `dependencies`, `devDependencies`, or `optionalDependencies`:

1. Update the version range in the relevant manifest(s).
2. Install dependencies.
3. Confirm the lockfile reflects the intended version.

In a **workspace/monorepo**, find every workspace manifest that declares the package. As much as
reasonably possible, use the **same version range** across internal packages. Watch **peer
dependency** constraints — especially for React Native packages, where mismatched peers break
installs or runtime.

### 2. Transitive dependency — bump the owning direct dependency

If the target is transitive:

1. Use the package manager to find what depends on it (e.g. `npm explain lodash`,
   `yarn why --recursive lodash@4.18.1`).
2. Identify the **owning direct dependency** (or nearest direct dep you control).
3. Check that direct dependency's changelog/releases to see whether a newer version pulls in the
   desired transitive version.
4. If inconclusive, try bumping the direct dependency empirically, install dependencies, and inspect
   the lockfile.

**Version bump risk:**

- **Patch/minor** direct-dependency bumps are usually safe.
- **Major** bumps: read breaking changes. If adoption is trivial (simple API rename, config change),
  make the code change. If substantial, **brief the user** — name the dependency, the breaking
  changes, and the code areas affected — rather than forcing a large refactor unasked.

Repeat for intermediate owners if the chain has multiple levels.

### 3. Lockfile-only bump (within declared range)

If the owning direct dependency is already up to date and its declared range **allows** the target
transitive version, but the lockfile still pins an older one:

- Regenerate or edit the lockfile so the resolved version satisfies the declared range.
- Prefer letting the package manager resolve this via install when possible; direct lockfile edits
  are acceptable when the manager will not re-resolve correctly.

Do **not** use this to install a version **outside** the range declared by the owning dependency —
that requires step 1 or 2, or step 4 for security exceptions.

### 4. Override / resolution (last resort only)

Set an override **only when**:

- A transitive dependency has a **known vulnerability**, and
- Direct (or intermediate) dependencies **cannot** be updated to pull in a patched transitive
  version.

Document **why** the override exists and what would remove it.

When touching existing overrides, ask whether each can be **removed** in favour of steps 1–3. Some
overrides are genuine pins (e.g. forcing a single `@mui/*` or `styled-components` version to avoid
duplicate runtime copies). Treat those as intentional unless the user wants to unwind them.

## Workflow checklist

```
Task progress:
- [ ] Identify target package and desired version (or "latest safe" / patched)
- [ ] Classify: direct or transitive?
- [ ] If transitive: trace owners; try direct-dep bump first
- [ ] Update manifest(s); align ranges across workspaces if applicable
- [ ] Install dependencies; verify lockfile
- [ ] Run validation (see below)
- [ ] One dep (or tight cluster) per PR; note override rationale if any
```

## Validation

After any dependency change, run the **broadest reasonable CI checks** for the affected scope — not
install-only.

1. **Install dependencies** and confirm lockfile changes are intentional.
2. **Build** affected workspaces/packages.
3. **Lint and typecheck** if the repo provides them for the touched area.
4. **Run tests** for packages that depend on the bumped dependency (directly or transitively).

Narrow scope when possible (e.g. npm workspace filters for one package). Expand to root-level
scripts when the bump is shared (React, TypeScript, ESLint, etc.) or ownership is unclear.

### Tamanu (this repo)

Root manifest uses **npm workspaces** and `package-lock.json`. Common commands:

| Scope           | Example                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| Full build      | `npm run build`                                                                |
| Full test suite | `npm run test`                                                                 |
| Lint            | `npm run lint-all`                                                             |
| Single package  | `npm run facility-test`, `npm run central-test`, `npm run web-unit-test`, etc. |
| Workspace scope | `npm run build --workspace=@tamanu/facility-server`                            |

Existing root `overrides` pin shared versions (React, MUI, axios, etc.). Prefer manifest bumps that
make an override unnecessary; do not add new overrides without the security exception above.

PR/commits: use `deps` scope if the repo allows, otherwise try `chore(deps)`, then fall back to asking the user. For example, ‘deps: bump `concurrently` 9.2.3 → 10.0.3’.

## Briefing the user

When you cannot complete a bump without substantial work, report:

- **Package** and current → target version
- **Why** (transitive owner, peer conflict, breaking major, etc.)
- **Breaking changes** from the release notes
- **Estimated code touch** (files/areas)
- **Recommended next step** (override for CVE only, or planned migration PR)

## Anti-patterns

- Adding or widening `overrides`/`resolutions` when a manifest bump or direct-dep update would work
- Bumping unrelated dependencies in the same PR
- Divergent version ranges for the same direct dep across workspace packages without reason
- Major bumps with breaking API changes and no migration or user briefing
- Skipping build/test because “it’s just a patch”
