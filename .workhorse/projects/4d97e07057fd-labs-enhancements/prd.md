# Labs Enhancements

## Overview

Tamanu's labs subsystem covers the full request lifecycle — order a lab request, collect and record a sample, receive it at the laboratory, enter and verify results, then publish and print. It also syncs with external laboratory systems (e.g. SENAITE) over the FHIR API. This project groups a set of enhancements across that lifecycle. The specific improvements are still being scoped — this PRD maps the areas open for enhancement so individual pieces can be broken out into cards.

The lab request moves through these statuses: `Sample not collected` → `Reception pending` → `Results pending` → `Interim results` → `To be verified` → `Verified` → `Published`, with side branches for `Cancelled`, `Rejected`, `Invalidated`, `Entered in error`, and `Deleted`.

## Request creation

- The lab request form (`LabRequestForm`) is a multi-step flow supporting three request types: panel, individual test, and superset
- Captures test category, priority, laboratory, sample collection details, and notes
- _Candidate enhancements to be defined during scoping — detailed shape can be filled in during card shaping._

## Reception & sample handling

- Sample recording (`Record sample` / sample details) captures collection time and specimen details before the request can advance out of `Sample not collected`
- Reception at the laboratory transitions the request through `Reception pending` and `Results pending`
- Change laboratory, change priority, and change status actions are available from the lab request view
- _Candidate enhancements to be defined during scoping._

## Results entry & verification

- Results are entered per lab test (`Enter results`), with result types of free text, number, or select
- Individual lab tests support numeric and non-numeric reference ranges (recently extended — see `feat(labs): TAM-6820`)
- Results progress through `Interim results` → `To be verified` → `Verified` → `Published`
- Result history is retained (`NASS-1875`)
- A results interpretation / conclusion field flows through to the FHIR DiagnosticReport
- _Candidate enhancements to be defined during scoping._

## External laboratory integration (FHIR / SENAITE)

- Lab requests materialise as FHIR ServiceRequest and results as DiagnosticReport
- External labs can specify result method, custom reference ranges, and the laboratory officer via the FHIR API
- Invalidation and rejected-status workflows are mapped between Tamanu and the external lab
- _Candidate enhancements to be defined during scoping._

## Printing & reporting

- Print request, print label, print results, and print interim report actions exist on the lab request view, gated by the `features.labRequest.enableLabResultsPrintout` setting
- Multiple lab requests can be printed together
- _Candidate enhancements to be defined during scoping._

## Listing & search

- The lab request listing (`LabRequestListingView`) groups requests as Active vs Completed and supports search/filter
- _Candidate enhancements to be defined during scoping._

## Open questions

- What are the specific enhancements in scope for this project? The sections above are the candidate areas; each needs concrete requirements before it becomes a card.
- Which enhancements are frontend-only versus requiring model/migration or FHIR materialisation changes?
- Are any of these driven by a particular deployment or external-lab integration requirement?
