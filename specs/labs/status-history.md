---
id: LABSTAT
---

# Lab request status history

A lab request moves through statuses as it is collected, received, tested, verified and published. Every one of those transitions is accountable: when it happened, and who caused it. Staff read that history from the request's status log, and a published results printout names the person who published them.

## What counts as a transition

- [ ] A transition is recorded whenever a lab request's status changes, whichever path made the change: a clinician acting in the app, the results ingest from an external laboratory, or the automatic publisher.
- [ ] Writing the same status a request already holds is not a transition, and editing other fields of the request is not a transition.
- [ ] The status a request was created with is the first entry in its history.

## Attribution

- [ ] A transition is credited to the person responsible for it, not to the mechanism that performed the write: a request whose results arrive from an external laboratory is credited to the practitioner who requested it, and an automatically published request likewise.
- [ ] Status history is reconstructed from changelog entries (see `specs/audit/changelog.md`), so the credited user is the entry's audit user, and paths acting on someone's behalf set that user explicitly.

## Reading the history

- [ ] The status log lists every transition for a request, most recent first, with the date and time, the status moved to, and the name of the user credited.
- [ ] The published results printout names the user credited with the most recent transition to published or verified, and its absence means the request has never been published.
- [ ] History that predates the changelog reads the same as any other, carrying its original time, status and user.
