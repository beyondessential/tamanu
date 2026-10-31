---
workhorse-version: 0.7.4
---

# Driving the app in a real browser

How an agent gets a browser, runs the workspace's app and drives it, in a workspace it has never seen. `qa-loop` and `hands-free-feature` depend on it. Nothing here is guaranteed by the platform: a browser, the app's dependencies, a database and network access are all things to check, and a check that fails is reported, never assumed away.

## Where a browser can run

- **On the user's device**, in a local conversation: Bash is unrestricted, so everything below applies.
- **On the cloud**: Bash is restricted and there is no browser. Say so at the start of the run, do every check that needs no browser, and list each browser check as not verified. Do not substitute reading the code for running it.

## 1. Preflight: prove you have a browser

Work down the list and stop at the first that passes the smoke test.

1. **The repo's own Playwright** (`@playwright/test` or `playwright` in its `package.json`): use its version and config, with `npx playwright install chromium` if its browser is missing.
2. **System Chrome or Chromium**, driven by `playwright-core` with `channel: 'chrome'` (or `executablePath`). Check the usual places: `/Applications/Google Chrome.app` on macOS, `google-chrome`, `chromium` or `chromium-browser` on the path on Linux, `Program Files\Google\Chrome` on Windows.
3. **Playwright's own Chromium**, installed into its cache by `npx playwright-core install chromium` (about 100 MB, needs the network, and is the same cache every Playwright project on the machine uses). A cache that already holds some Chromium is not enough: `playwright-core` wants the build matching its own version, and a mismatch fails with "Executable doesn't exist". Install, rather than reusing what is there.

Install `playwright-core` in the card's work directory (`workhorse-local rig workdir`), not in the repo, so no dependency lands in the user's `package.json`.

**The smoke test is the only judge.** Launch headless, open a `data:` URL, set CPU throttling over CDP, take a screenshot and close, within about 30 seconds:

```js
import { chromium } from 'playwright-core'
const browser = await chromium.launch({ headless: true, channel: process.env.CHANNEL })
const page = await browser.newPage()
await page.goto('data:text/html,<h1>ok</h1>')
const cdp = await page.context().newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await page.screenshot({ path: 'smoke.png' })
await browser.close()
```

Leave `CHANNEL` unset for Playwright's Chromium and set it to `chrome` for system Chrome. If nothing passes, write "no browser" and the reason in the loop log, mark every browser check not verified, and say in the final report what the user would need to install. Do not stop to ask mid-run.

## 2. The rig is managed, not built by hand

A rig is a built, running copy of the app at one commit, with a port and a database. The device manages them with `workhorse-local rig`, run in the card's checkout; the repository and the card are worked out from it. **Ask for a rig at the commit under test. Never build, copy or serve the app yourself.**

```sh
workhorse-local rig lease --holder "qa-loop/adversary-3" --holder-pid parent   # JSON: url, port, database, accounts, fixtures, lease id
workhorse-local rig release <lease>                        # stop the server, drop the database, delete scratch
workhorse-local rig help                                   # every command, flag and exit status
```

`rig resolve [<ref>]` prints the full sha a ref names, for passing to `--commit`.

- **One build per commit, shared.** The first lease for a commit builds it; every later lease, by any agent in any round, reuses that build and waits if it is still being made. Commit your change first: a rig is a build of a commit, not of the working tree, and the command warns when the tree has uncommitted changes. Dependencies are installed once per lockfile hash and linked in, so a build costs its output and not another copy of `node_modules`.
- **A lease is yours alone.** It holds a port bound to `127.0.0.1`, a database cloned from the build's seeded template, and the running server. Two agents testing the same commit hold two leases and cannot collide. `rig reset <lease>` returns yours to the seeded state. `rig env <lease>` prints the values as shell exports.
- **Release it before you report.** Name yourself with `--holder <run>/<role>` (the card groups leases by the part before the first slash), pass `--holder-pid parent` (the process above the shell that runs your commands, what `$PPID` is in bash and zsh; the word works in fish too, which has no `$PPID`), and release what you took, even when the work failed. The device ends a lease within a minute or two of its holder process going, so an agent that is cut off leaves nothing behind; leave `--holder-pid` out for a lease meant to outlive your turn. A lease you forget expires an hour after its last renewal (`rig renew <lease>` extends it, and `leaseTtlMinutes` in the rig root's `config.json` sets the hour) while the device's local app is running, but do not rely on that.
- **A lease ends when its time runs out, even while its holder is alive.** A run that can last longer than the hour (a QA round, a hands-free build) takes its lease with `--ttl 4h` (at most 24h), or renews it with `rig renew <lease>` at least every half hour. A laptop that sleeps past the time has its leases ended within a minute of waking. A lease that has ended answers `not found` (status 7): take a new one, and do not go on testing against the old port. Only a device's sweep ends a lease: with none running (CI, or a machine whose local app is off), a lease past its time stays usable until `rig gc` or a renewal, so do not read a working port as proof the lease is current.
- **Never write into a leased build's source.** It is shared by every agent at that commit, so a probe or a mutation there breaks the build for all of them. Put scripts and probes in your work directory, and mutations and audit trees in a scratch checkout.
- **Scratch space comes from the rig.** For a throwaway checkout (a mutation run, an audit tree) use `workhorse-local rig scratch --name <what>`: the commit's source with dependencies linked, under the card, size capped, deleted with its lease or by collection. Never `cp -R node_modules` or copy the repositories directory.
- **Your own scripts and reports** go in the directory `workhorse-local rig workdir` prints (as JSON, `{ "path": ... }`): a durable directory for the card that holds `playwright-core`, scripts, screenshots, filmstrips and bulk reports. It is outside the repository and outside `/tmp`, which the operating system cleans mid-run, and it is cleared with the card, or after two weeks without a write. Copy a report worth keeping with `rig keep <file>` (a plain file of at most 5 MB); it stays with the card after the rig is cleared, up to 50 MiB per card (the largest files go first when the card is cleared, and the command says how many) and for 30 days without a write.
- **Check the disk.** `rig status` shows the free space, what is leased and what the card holds against its budget. A lease or build refused for low disk or budget says so and exits with status 4: stop and report it, do not look for another way to build. The thresholds are set in `config.json` in the rig root (`minFreeGb`, `cardBudgetGb`, `globalBudgetGb`, `scratchCapGb`, `homeMaxGb`, `keepBuilds`, `buildMaxAgeHours`, `leaseTtlMinutes`, `legacyMaxAgeHours`, `artefactMaxBytes`, `artefactMaxAgeDays`, `portBase`, `portCount`, `pgAdminUrl`, and `passEnv` for variables a recipe needs from your environment); `WORKHORSE_` variables do not reach an agent's turn, so that file is where you and the device agree. A `WORKHORSE_RIG_` variable for one of those settings (such as `WORKHORSE_RIG_PG_URL`) set in the device server's own environment takes precedence over the file for the server's card routes, sweep and collection, and you never see it. `WORKHORSE_RIG_HOME`, which moves the root itself, is different: `config.json` lives in the root, so it cannot override that, and an agent's turn does not carry it, so a device that moves its root has moved it for itself alone and the Rigs bar, sweep, Stop and Clear no longer see any agent's leases. The default location is the one place the device and every agent share.
- **Exit statuses you act on:** 2 usage (a flag or word the command does not take, an empty value, a `--card` that is not this checkout's card), 4 disk or budget, 5 the database cluster is unreachable, 6 a build or server failed (including an entry point the system cannot execute: its message names the likely fix, such as a `#!` line or Windows line endings), 7 no such lease, 9 a lock was not free in time (the message names the process it waited on; if it says that process is stopped, continue or end it, otherwise run the command again). A repository with no recipe and a recipe that exists but is invalid each have a status of their own, listed by `rig help`.
- **Say whose card it is.** Run the command in the card's checkout and leave `--card` off. If you pass it, a code that is this checkout's own card (`E40` in the checkout of `e40-2`, the second workspace's card with that code) is this checkout's card; naming another card the rig does not hold is a usage error, not a way into someone else's rig. The repository is the checkout's `origin` remote; a checkout whose remote does not say `owner/name` (or has none) is refused with a usage error asking for `--repo owner/name`, the repository the card belongs to, since a rig under any other name is invisible to the card page.
- **Read what `lease` prints on standard error.** It warns when the recipe files in the working tree are untracked or modified (a rig is built from the commit, so commit them and lease again), when the commit's recipe has no `serve` entry point (the rig is `ready` with no URL), and when `--holder-pid` names no running process. A lease whose JSON you never received is named on standard error with the command that releases it.
- **The rig root is the manager's own directory.** The default is right; `WORKHORSE_RIG_HOME` must name a new or empty directory. A home directory, a checkout or a directory holding anything else is refused with a usage error by every command, `status` and `gc --dry-run` included, and nothing in it is touched.
- **Recipe steps run with their own `HOME`**, a directory inside the rig root, so a recipe cannot read your home, and its package manager's cache persists between builds. A recipe that needs something from your home (a private registry's token) lists `HOME` under `passEnv` in the rig root's `config.json`; the person who owns the machine decides that, not the recipe.
- **Bind everything you start to `127.0.0.1`.** That covers a fake service, a standalone `server.js`, a dev server or a mock API run outside a lease. Never listen on `0.0.0.0`, `::` or `*`: on macOS that raises a "wants to accept incoming network connections" prompt on the developer's machine, and an Allow makes the server, with its seeded test tokens, reachable from the local network. Pass the address explicitly (`server.listen(port, '127.0.0.1')`, `next dev -H 127.0.0.1`), because `HOST` is not read by every tool. Run each process from a worktree or the rig's own directory, never from `/` or the home directory, and never search `~` or `/` for something: macOS asks for each protected folder such a walk reaches.
- **The shared Postgres belongs to the device.** Leases take databases from it. Never start, stop or reconfigure it, and drop only what you created.

## 3. When the repository has no rig recipe

A repository describes how to build and run itself in `.workhorse/rig/` (`workhorse-local rig help recipe` prints the contract). If a lease fails with `no-recipe`, **write the recipe, so the repository has one from then on** (a lease that fails with `bad-recipe` has a recipe that is invalid, and the message says why: fix it, do not write another):

1. Find out how the app runs, in this order: the repo's own instructions (`CLAUDE.md`, `AGENTS.md`, `README`, `package.json` scripts, `Makefile`, `docker-compose`, a project skill, the `run` skill). Prefer a production build served detached over the development server, because behaviour differs on exactly the things feel depends on.
2. `workhorse-local rig init` scaffolds `rig.json` and stub entry points. Fill in `deps` (install), `build` and `serve` (foreground, on `$RIG_PORT`, bound to `$RIG_HOST`), and add a `seed` entry point when the app needs a database (it receives the template database in `$RIG_DATABASE_URL`). `seed` and `reset` run only for a recipe whose `rig.json` says `"needs": { "postgres": true }`; with `"postgres": false` they are never invoked, so a recipe that seeds files does it in `build` or `serve`. Declare accounts, sessions and fixtures a tester needs in `rig.json` under `provides`.
3. Seed what the tests need: a user at each permission level where the surface is multi-user, awkward data shapes, and fake external services (mail, payments, third-party APIs) in the server's process group and bound to `127.0.0.1`, never the real ones. Sign in through whatever the repo offers for tests: a seeded session, a test login or a dev bypass.
4. Commit the recipe, then lease at that commit to prove it. A lease warns when `.workhorse/rig/` holds files that are untracked or modified, and when the commit has no `serve` entry point, so a rig that came up with no URL is not mistaken for a working one. Fix the recipe until a lease comes up and the app answers.
5. If the app cannot be started after a fair attempt (missing services, secrets only the user has), say what blocked it, commit what you have, and test the layers that do run: unit, integration, API through the test harness.

The recipe is the repository's, committed like any code: it is how a person, an agent and CI build the same rig, so write it for all three.

## 4. Driving it

Script every flow with Playwright, kept in the card's work directory (`rig workdir`).

- **Time input to result:** from the input event to the first animation frame in which the visible result is true (`requestAnimationFrame` after the change, or `performance.now()` across a mutation observer).
- **Throttle twice.** Run each flow locally and again on Fast 3G with 4x CPU: `Emulation.setCPUThrottlingRate` with `rate: 4`, and `Network.emulateNetworkConditions` with `latency: 150`, `downloadThroughput: 204800`, `uploadThroughput: 96000` (bytes per second, so about 1.6 and 0.75 Mbit/s).
- **Record on every step:** console errors and warnings, `pageerror`, failed and 4xx or 5xx requests, layout shift (a `PerformanceObserver` on `layout-shift`), and the focused element (`document.activeElement`).
- **Filmstrip an interaction:** a screenshot per frame, or a trace, for anything that animates, drags or reflows. Look at each frame for a flicker, a double paint, a jump, or a frame holding both the old and the new state.
- **Viewports:** 1440, 1024 and 390 wide, at a device scale factor of 2 when measuring.
- **Two people:** two browser contexts, signed in as different users, for anything shared or live.
- **Break the connection and the session:** `context.setOffline(true)`, reload mid-action, Back and forward, an expired session, a server restart.
- **Keyboard only:** drive a flow with no pointer, and note where focus goes after each action.
- **Accessibility:** inject `axe-core` from the work directory where it installs, and read the accessibility tree with `page.locator('body').ariaSnapshot()` for names, roles and state.

Keep every script. A finding is only as good as the script that reproduces it.

## 5. Evidence and tests

- Each browser finding names the script, the viewport and throttling it ran under, and the screenshots, so a fixer and a re-checker can run the same thing.
- Looking at screenshots is the orchestrator's job. Capturing them is an agent's.
- The leased rig and the work directory are scaffolding and are not committed; the recipe is. A defect it finds that the repo's own tests did not cover gets a committed test in the repo, written in the repo's style at the lowest level that would have caught it. A defect only a browser shows (layout, focus, timing) gets an end-to-end test in the repo's own browser test framework, if it has one. If it has none, record the case in the test-cases file and as a follow-up, and do not introduce a framework silently.

## 6. Cleanup and disk

Looping runs fill disks: one run made about 400 builds and filled a volume. The manager bounds this, and what you do keeps it bounded.

- **Free disk is checked before a build.** Below the threshold (20 GB free by default) no build starts, and the command says how much is free. Report it; the user can free space.
- **Collect between rounds.** The orchestrator runs `workhorse-local rig gc --card <card>` at the start of every round and when a card lands: that collects this card in this checkout's repository only. The plain `workhorse-local rig gc` is machine-wide, every repository and card on the device (the device's own six-hourly collection is that form), so it also removes other cards' unleased builds beyond the newest and their work directories idle for two weeks; leave it to the device and to a person clearing a disk. Collection keeps the newest builds and anything leased, removes scratch, databases and servers nothing accounts for, and prints what it removed. `--dry-run` shows what it would remove.
- **End what you start.** Release your leases before you report. A server, a database or a scratch folder made any other way is yours to stop and drop by the id you recorded, never by a pattern: `pkill -f` also matches the shell running it.
- **Count the disk with `df`, not `du`.** Build copies are copy-on-write clones on some filesystems, so `du` overstates and deleting them frees far less than it says.
- **Keep a "rigs and disk" line in the loop log** each round: free space, leases outstanding, and the card's use against its budget (`rig status`).
- **A card that lands is cleared.** Merging or closing it ends its leases and removes its builds, scratch and work directory; only reports kept with `rig keep` stay. A card that is only left alone for a week (a holiday, a long review) is not cleared: its leases end at their time and its builds and scratch go by the ordinary policy, and its work directory is removed after two weeks without a write, whatever state the card is in. Copy what must last longer with `rig keep`.
- **What the manager did not make** stays: anything in the rig root, or in a repository's directory there, that is not the manager's own is never collected, however old, and `rig gc` lists it under `unknown` for you to move or remove yourself. So keep nothing of your own in the rig root; use the card's work directory (`rig workdir`) or a scratch checkout. The rig root itself must be a directory, not a link: to keep rigs on another volume, set `WORKHORSE_RIG_HOME` to a directory there. A link inside the root (a card's `scratch` moved elsewhere) is never collected or written through. The home recipe steps run with (`<root>/.home`, npm's cache and browsers a step downloads) is counted in `rig status` and cleared when no step is running.
- **Older rig data** beside the rig root: rig directories beside the rig root are always listed by `rig gc`, and removed only by one explicit `workhorse-local rig gc --legacy --yes`, which the user runs once. `--legacy` without `--yes` lists each of those older directories as one that would be removed or kept, with the reason, and removes none of them (the ordinary collection still runs, as it does for every `rig gc`; add `--dry-run` to see that without removing anything). It also judges, in the default rig location, the old per-card directories that agents kept at the top of the root itself. It works child by child, never removes a directory whole, and only for the default rig location. Collection never touches a Postgres data directory, running or stopped: one is a directory named `pg` or `pgdata`, or holding `PG_VERSION` or `postmaster.pid` within three levels.
