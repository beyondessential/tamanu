# Mobile Love

## Overview

A cluster of reliability and performance improvements to the Tamanu mobile app, driven by the IRD Pakistan deployment. Field staff there are hitting sync failures, sluggish dropdowns, and a slow update path. This project groups those pain points, plus a survey-validation fix, into one push to make the mobile app dependable in low-connectivity, high-volume conditions.

The mobile app (`packages/mobile`) is a React Native Android app used at smaller facilities and for remote outreach, syncing to a central server. IRD Pakistan is a large, low-connectivity deployment where these issues bite hardest.

---

## Priority summary

| # | Original request | Feature | Priority | Design work |
|---|---|---|---|---|
| 1 | Mobile sync issues (IRD Pakistan) | Reliable mobile sync under high volume / poor connectivity | High | TBD |
| 2 | Dropdown performance | Faster dropdowns and selection lists | High | TBD |
| 3 | Updates over the air | Over-the-air app updates | High | TBD |
| 4 | Mandatory-when-visible | Mandatory questions required only when visible | Optional | None |

---

## Requirements

### 1. Reliable mobile sync under high volume / poor connectivity

Mobile sync at IRD Pakistan is failing or stalling. The goal is a sync that completes reliably on constrained networks and large datasets, recovers cleanly from interruptions, and gives staff clear feedback on progress and failure.

**Open questions**
- What are the concrete symptoms? (e.g. sync never completes, times out, restarts from scratch, specific errors, device runs out of memory/storage)
- Is it push, pull, or both? First-time setup sync or incremental?
- Rough data volume per device and typical network conditions.
- Are there error logs or Canopy healthchecks pointing at a cause?

---

### 2. Faster dropdowns and selection lists

Dropdowns and other selection controls are slow at IRD Pakistan. The goal is selection controls that open and filter fast even against large reference-data sets.

**Open questions**
- Which dropdowns? (survey question selects, patient/reference-data suggesters, location/department pickers, autocomplete search)
- What's slow — opening the list, typing/filtering, or scrolling a long list?
- Rough option counts (e.g. thousands of villages/locations).
- Is this device-class dependent (low-end Android)?

---

### 3. Over-the-air app updates

There is no in-app update mechanism today; updating the app means redistributing an APK. The goal is to deliver app updates to devices over the air, so fixes reach the field without a manual reinstall.

**Open questions**
- Scope: JS-bundle-only updates (CodePush / expo-updates style) or full APK delivery?
- Who hosts the update payload — central server, an MDM, or a third-party service?
- Forced vs optional updates; behaviour when a device is offline for a long time.
- Any constraint against third-party update services (data residency, connectivity to app stores)?

---

### 4. Mandatory questions required only when visible

A survey question marked mandatory should only block submission when it is actually visible to the user under the current visibility criteria. A hidden mandatory question must not prevent submission.

On mobile this already holds: the survey form derives its validation schema from visible components only and submits only visible values (`packages/mobile/App/ui/components/Forms/SurveyForm`). Needs confirmation of where the reported problem actually occurs.

**Open questions**
- Where was this observed — mobile, web, or both? (web survey logic lives in `packages/web/app/utils/survey.js`)
- A concrete survey/question example that reproduces it.
