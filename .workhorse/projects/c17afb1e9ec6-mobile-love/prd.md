# Mobile Love

## Overview

The Tamanu mobile app (`packages/mobile`, React Native Android) hasn't had focused attention for a long time. It's now being used at scale again, and new users at IRD Pakistan are hitting the resulting pain points. This project is a theme rather than a clean feature: work out what love mobile needs and give it to it, within one cycle.

IRD Pakistan drives the agenda. Grounding the work in a real, active deployment keeps it concrete and keeps that customer feeling attended to — the reported issues are sporadic and much easier to bear when there's clearly someone paying attention. The specific items below come from IRD's support thread (Michael's feedback).

Almost everything here is "do the same thing, but better" — no behaviour change. If a piece starts to lean into behaviour change, it escalates to Megan; otherwise Edwin owns it.

---

## Approach and ways of working

- **Platform team project.** Product/platform owner: Edwin. Behaviour-change decisions escalate to Megan.
- **FDE-led with wide autonomy.** Jasper leads as a (virtual) forward-deployed engineer with unusual latitude over prioritisation and sizing. The charge: find the biggest pain points and have them fixed by end of cycle. If that means tilting all the time into performance, or a big refactor, raise it with Edwin.
- **Rough shape.** Around 50/50 between performance work and over-the-air updates, if OTA proves worth its (non-trivial) effort. The mandatory-when-visible fix is a small clean win on the side. This split is indicative — prioritisation genuinely sits with the FDE, informed by what IRD reports.
- **Be proactive and present.** Investigate logs, get time with users where possible, reproduce with the same data they load. In-country wasn't feasible before September; the fallback is a live channel with calls in Pakistan hours. Access is sporadic, so make headway independently — don't block on customer input.
- **Spend freely on agents** to move faster.
- **Frustration metric.** Rohan is building a desktop user-frustration metric from click-lag detection and aggregate scores. A mobile equivalent would be valuable — worth meeting him, even if it isn't deployed this cycle.

---

## Priority summary

| # | Original request | Feature | Design work |
|---|---|---|---|
| 1 | Sync reliability (IRD) | Everyday sync reliability | None |
| 2 | Performance regressions | Mobile performance sweep | None |
| 3 | Updates over the air | Over-the-air app updates | Minor (update prompt) |
| 4 | Form progression errors | Mandatory questions required only when visible | None |
| 5 | Disappearing data | Disappearing-data investigation | None |

Ordering is indicative, not a fixed backlog — see the autonomy note above.

---

## Requirements

### 1. Everyday sync reliability

IRD's everyday (incremental) sync is failing sporadically. A support ticket was resolved and sync was working, then it began failing again for some users. The goal is dependable day-to-day sync, with enough visibility (logs, user reports) to catch and fix the causes of these intermittent failures.

This is investigative first: get to know mobile sync again, look at where these failures happen for IRD specifically, and fix what's found.

**Focus**
- Incremental sync only. Initial (first-time) sync is out of scope — see below.
- Which users, which facilities, and what the failure looks like (stalls, errors, partial sync).
- What the logs and any Canopy healthchecks show.

---

### 2. Mobile performance sweep

Mobile feels slow and frustrating in places — the program selector Jasper worked on is one known example. This is a piece-of-string task: find where mobile is slow for users and fix it. Dropdowns and other selection controls are a likely hotspot.

**Approach**
- Load the same kinds of data IRD load, click around, and find the slow render cycles and click lag. Many of these are probably noticeable but go unnoticed because the app isn't exercised enough internally.
- Run an AI-assisted performance sweep (a "fable run") over the mobile codebase to find and fix obvious performance problems.
- Consider a mobile version of Rohan's frustration metric to quantify and track this.

---

### 3. Over-the-air app updates

IRD find it hard to update their devices manually via the provided URL. They asked for the app to be on the Google Play Store; the answer so far has been no, but that discussion is worth reopening. The goal is a less painful way to get app updates onto field devices.

This item carries the most open scoping. Whether it fits this cycle in full, in part, or trails into the next depends on the effort once the delivery mechanism is chosen.

**Open questions**
- Delivery mechanism: Google Play Store, JS-bundle OTA (CodePush / expo-updates style), full APK delivery, or MDM-driven. No in-app update mechanism exists today.
- Forced vs optional updates, and behaviour for devices offline for long stretches.
- Any constraints against a store or third-party service (connectivity, data residency).

---

### 4. Mandatory questions required only when visible

At IRD, staff couldn't progress a form because questions marked mandatory were blocking submission while hidden by their visibility criteria. A mandatory question should only block submission when it's actually visible under the current visibility criteria.

Michael read this as a configuration error; Edwin believes it's a software bug. Desktop already enforces mandatory-only-when-visible, and the mobile survey form already appears to derive its validation schema and submitted values from visible components only (`packages/mobile/App/ui/components/Forms/SurveyForm`). So this is a small, clean ticket: confirm the exact case IRD hit and close the gap.

**Focus**
- Reproduce the specific survey/question that blocked progression at IRD.
- Confirm whether the gap is in mobile validation or somewhere adjacent (e.g. calculated/hidden fields, multi-screen surveys).

---

### 5. Disappearing-data investigation

IRD reported data disappearing on mobile. It's unclear whether this was real. The goal is to find out: did records actually go missing, or did users see different views at different times and read that as loss? This is FDE work — investigate through logs and directly with users, and fix if a real defect is found.

---

## Out of scope

- **Initial (first-time) sync optimisation.** IRD's initial sync is large (tens of millions of records, a couple of hours) but heavily optimised already (Daniel's work last year) with little low-hanging fruit, and IRD's complaints are about everyday use, not first sync.
- **Backend-maintenance / "spider" stability.** Raised in the thread as a possible cause of instability; checked and ruled out.

---

## Action plan after kick off

Two follow-up sessions sharpened the plan: an internal working session (Edwin + Jasper) and a first call with the IRD team. This section captures how the engagement runs and the concrete threads to pull, for the virtual-FDE window through ~20 August. It's a live working plan, not fixed scope.

---

### Engagement and coordination with IRD

- **WhatsApp group is the primary channel.** Field supervisors report issues there and tag Jasper; follow up with a separate call for detail as needed. This is faster and more feasible for field teams than email or scheduled meetings. Jasper to be added to the group.
- **Live contact with the actual user is the goal.** When an issue is reported, get the user to screen-share or pull logs *while it's happening* — server conditions, load, and query behaviour change within hours, so after-the-fact diagnosis is much weaker.
- **Points of contact.** Saman coordinates. Minhal (field team supervisor) and others rotate depending on location and activity — not a single fixed POC. Bilal (technical consultant) is on WhatsApp for technical questions.
- **IRD-side tracking.** Bilal is standing up OS Ticket to dedupe and track support requests (many users report the same issue). Jasper maintains an issue log/sheet alongside and shares it; start with a spreadsheet as agreed, switch to something better if it becomes a pain point. Keep Edwin updated.
- **Cadence.** Proposed Mon/Wed standups (note: Edwin doesn't work Wednesdays). Jasper to send IRD an opening email: the focus areas he's starting on, and the most useful things IRD could provide next (e.g. direct time with a user who hit a specific problem, or a list of dates when data went missing).
- **This is a trial.** If virtual support proves unproductive, a physical visit can be revisited — but it carries administrative and security overhead (NOCs for foreigners, less-safe remote areas), so make as much headway independently as possible.

---

### Field context that shapes the work

- **Campsites are largely offline** — no fixed internet or electricity (generators in mobile vans). Facilities have internet that's mostly stable but drops out.
- **Devices are low-spec Android** (Oppo and similar budget brands, not Samsung/Apple); performance work must assume weak hardware.
- **ET-device workflow drives desktop use.** Teams use an ET device to sync forms between field stations and run Tamanu desktop against it, because the mobile app can't connect to the ET device. On mobile, an operator can't hand a patient to the next station without waiting for internet to sync — counterintuitive, hence desktop. (Mobile-to-ET connectivity is a standing wish, likely beyond this cycle — flag to Edwin/Megan if it grows legs, as it leans toward behaviour change.)
- **Live diagnosis is constrained** by offline campsites — plan around not always being able to reach a device mid-issue.

---

### Performance (start immediately, no external input needed)

- Run an AI-assisted sweep ("fable run") to identify and fix mobile performance problems broadly, plus targeted work on known hotspots: the program/form selector (forms taking 3–5 minutes to appear on a lightly-populated program), and general data-entry / next-question lag that Minhal reports as no better on the latest build (v0.5.29).
- The just-finished React Native upgrade unblocks this work.
- **Ship as a proper release into `main`**, not scattered hot fixes, so the wide blast radius is covered by one big mobile regression test and a scheduled upgrade. Backport to 2.54 only case by case.
- Consider a mobile version of Rohan's click-lag frustration metric to quantify and track improvements.

---

### Sync investigation

Symptoms from the field: initial sync ~33–37 min on a fresh install even on fast office internet, often not finishing (restart from scratch), and crashes during both initial and incremental sync — random, ~10% of users, none reported in the last three weeks. Recent error reports include a disk-IO error and a DB "driver" error on an index-creation query (looks migration-related).

Server-side (doable without waiting on IRD):
- Query the central `sync_sessions` table for patterns — clusters of failed syncs, and syncs that are especially long in the **download** or **persist-to-local** phases (the snapshot phase should be consistent between Karachi and the field, so long tails there are the signal). Use Claude/Cursor with the support-docs skills to generate the SQL.
- Advise IRD on **facility setup**: they appear to use a single facility, and patients marked for sync (a facility-level setting, not per-device) drive initial-sync size. Check the central DB for how many patients are marked and how much of the sync is encounter history vs base data; a facility with no patients marked for sync would sync far faster.
- Investigate **memory** as the likely crash cause — mobile has a history of initial-sync memory leaks, and removing the old write-to-file-then-persist step (needed when SQLite's 999 bind-parameter limit applied, pre-2.54) may have raised memory use.
- Audit **mobile indexes** — Felix's index audit was backend-only.

In-flight work to branch off or leverage (Edwin to share PRs):
- Felix's PR splitting initial sync into **boot / catalog / records** chunks — branch off this before making sync changes to avoid conflicts, and check whether it helps.
- Felix's recently-merged sync **streaming** work.
- Rohan's improved **foreign-key reporting** and central self-healing (central sends down missing referenced records), plus generally better mobile→central error reporting that landed after 2.54 — a reason to schedule IRD an upgrade for more "phone-home" visibility.

Open technical questions raised by IRD to answer/verify: exactly what the initial sync downloads (metadata vs all patient submissions) and whether it's scoped per facility or pulls the whole central DB; current payload size and whether GZIP compression is enabled; and whether an interrupted sync resumes from where it dropped or restarts.

---

### Data loss investigation

Take seriously despite the instinct to dismiss it. Two likely-distinct cases:
- **Mobile, upgrade-related:** users report unsynced forms disappearing after updating the app (sometimes ~50 forms; sometimes only some forms vanish after a sync completes). Working hypothesis is an upgrade path that deletes the old APK and installs the new one, dropping local data — needs confirming.
- **Desktop:** ~14–15 forms entered via Tamanu desktop didn't appear after a data download and had to be re-entered. More concerning (undermines the digital-only record), probably a different cause.

Progress depends on specifics — which records, when. Give IRD time to supply dates/details; if nothing lands in ~2 working days, follow up directly with whoever reported each case.

---

### Mandatory-when-visible (parked)

Not a live issue — IRD reconfigured to remove the mandatory questions, and both desktop and mobile are expected to gate mandatory on visibility (as Meditrak/DataTrack do). Leave to one side and revisit in spare time or a quick-wins batch; confirm whether mobile actually has a gap before doing any work.

---

## Missed in call between Jasper and Edwin

Items the IRD call surfaced that the internal working session didn't cover, or assumed the other way. Follow-ups to close.

- **Mobile ↔ Iti-device connectivity.** The reason IRD use desktop in the field and the real ceiling on mobile's field viability — a field mobile user can't hand a patient to the next station without waiting for internet, because mobile can't connect to the Iti device. Never discussed internally. Likely behaviour change and probably beyond this cycle → needs an explicit Edwin/Megan decision rather than silent omission.
- **GZIP compression.** Is the sync payload compressed? Bilal asked directly; answer owed back to IRD.
- **Resume vs restart on dropped connection.** Does an interrupted sync continue from where it stopped or start over? Critical given unstable field internet; never came up. Answer owed back to IRD.
- **Device specs list.** IRD offered to email specs of all mobile devices/tablets — make sure it lands.
- **Incremental sync has specifics now.** Not "vague" — crashes on both initial and incremental sync, ~10% of users, none in the last three weeks.
- **Performance not actually resolved.** The 3–5 min form-load fix worked for one user (Ali) but recurred for another on v0.5.29.
- **Strategic sizing note.** The field is desktop-first via the ET device; mobile is used mainly by phone-only staff without tablets. How big the mobile-sync prize is depends on how many are actually on mobile — and their "make mobile usable in the field" ask routes through the ET-connectivity question as much as raw performance.