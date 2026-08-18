# Scaling Confidence

## Overview

We operate Tamanu at growing scale (large facilities like Samoa, mass reference data, heavy sync and FHIR load) without a reliable way to know how it performs or to catch regressions before they reach production. This project builds that confidence: bake synthetic data and activity into every regression cycle, gather performance baselines for sync and FHIR, add automated tests that flag degradation, introduce telemetry so performance is visible longitudinally, and fix the central-sync bottlenecks that scale exposes.

The two halves reinforce each other. The regression harness and baselines let us *measure* performance and catch regressions; the telemetry and sync improvements *raise and observe* performance in the field.

---

## Priority summary

| # | Feature | Design work |
|---|---------|-------------|
| 1 | Bake synthetic data into the regression process | None |
| 2 | Baseline sync performance | None |
| 3 | Baseline FHIR performance on facility | None |
| 4 | Performance metric telemetry | Canopy dashboard |
| 5 | Improve central sync bottleneck with multiple clients | None |
| 6 | Simple priority system for sync clients | None |
| 7 | Fix low-hanging performance issues | None |

Ordering is foundational-first: the regression harness (1) underpins the baselines (2, 3), which in turn underpin the degradation tests. Telemetry (4) and the sync improvements (5, 6) run in parallel once baselines exist. Low-hanging fixes (7) are opportunistic throughout.

---

## Requirements

### 1. Bake synthetic data into the regression process

Every regression cycle should exercise Tamanu at scale, so performance and migration problems surface before release rather than in production.

- Regression testing runs against a sufficiently large database
  - Validate that every model is represented in the generated data (the `generate` subcommand / `@tamanu/fake-data` coverage), not just the common ones
- Migrations are validated on a large database
  - New migrations run smoothly against the large dataset
  - Migrations complete within an acceptable time frame — the harness flags migrations that are too slow
- Regression runs alongside high synthetic activity, simulating many simultaneous users and high throughput (the `@tamanu/synthetic-tests` Artillery scenarios)
  - Synthetic activity runs against the e2e test suite
  - The setup must not be annoying for testers — synthetic load is opt-in / automatic, not a manual chore
- **Validation:** introduce a genuine performance regression and confirm the process catches it

**Expected outcomes.**
- Regression testing catches performance issues introduced by a change
- Regression testing catches invalid or poorly performant migrations

---

### 2. Baseline sync performance

Use the regression harness to collect baseline metrics for the sync scenarios that scale stresses, then lock them in as automated regression checks.

- Baselines collected for:
  - Large snapshots
  - Mass reference data updates
  - Long time-since-last-sync
  - High-volume sync
  - Many sync clients
- Sync config variants covered:
  - Sync all lab requests enabled
- Baselines feed automated tests that flag performance degradation during regression
  - Where the thresholds live and how much variance is tolerated: to be settled during card shaping

**Expected outcome.** Greater understanding of and confidence in sync performance; automated testing catches sync degradation.

---

### 3. Baseline FHIR performance on facility

Same approach as sync baselines, applied to FHIR materialisation on the facility server.

- Baselines collected for:
  - Mass rematerialisation
  - FHIR on facility (materialisation and read load)
- Make FHIR ids deterministic
  - Prerequisite for stable, comparable baselines and for meaningful diffing between runs
- Baselines feed automated degradation tests during regression

**Expected outcome.** Confidence in FHIR materialisation performance; automated testing catches FHIR degradation.

---

### 4. Performance metric telemetry

Capture and report Tamanu's performance from a user's perspective, longitudinally, so support and engineering can see performance move over time rather than only during a test cycle.

- Capture sources:
  - **API performance** — from bestool and the API logs
  - **Browser performance** — investigate available JS libraries for client-side metrics
  - **Database query performance**
  - **System-level** — CPU, disk usage
  - **Sync performance**
  - **FHIR materialisation performance**
  - **Reports**
- All metrics report to Canopy
- A single headline "user frustration" metric derived from the above, tracked over time
- A central dashboard in Canopy for support to view

**Design updates.** The Canopy dashboard layout — the headline metric plus supporting breakdowns — needs a design pass; detailed shape can be filled in during card shaping.

**Expected outcomes.**
- A single metric showing user frustration over time
- A central dashboard support can view via Canopy

---

### 5. Improve central sync bottleneck with multiple clients

Deployments with many facility clients (e.g. Samoa) contend on the central server during sync. Relieve that bottleneck so many clients can sync without starving each other.

- Characterise the bottleneck first — where central serialises or contends when multiple clients pull/push concurrently
- Improve throughput under concurrent multi-client load
- Concrete approach depends on what the characterisation finds; detailed shape can be filled in during card shaping

---

### 6. Simple priority system for sync clients

Give central a simple way to prioritise some sync clients over others, so a burst of low-priority clients cannot delay a facility that needs to sync.

- A basic priority ordering applied to sync clients on central
- Deliberately simple — not a full scheduler; detailed shape can be filled in during card shaping

---

### 7. Fix low-hanging performance issues

Baseline gathering and testing will surface performance problems that are cheap to fix. Address them opportunistically rather than deferring.

- Fix performance issues that crop up during testing and baseline gathering
- Scope is emergent — captured as they are found

---

## Open questions

- **Telemetry reporting approach** — how metrics should be shaped and reported to Canopy (chat with Felix).
- **Degradation thresholds** — how baselines translate into pass/fail bounds for the automated regression checks, and where those bounds are stored.
- **Billing code** — unknown at time of writing.
