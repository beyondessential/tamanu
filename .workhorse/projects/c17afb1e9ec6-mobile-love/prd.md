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
