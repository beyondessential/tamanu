# Dispense medication modal shows no data on first click after cancel

## Root cause

The dispense modal builds its table rows into local state once per open, latched so that a
refetch or a translation-load re-render can't wipe in-progress modify/quantity/label edits.
It was latching onto whatever React Query served synchronously on open, which is the cached
response — and nothing invalidated `dispensableMedications` when a dispense was cancelled, so
that cache still held the post-dispense list where the medication was completed and therefore
absent. The background refetch returned the medication, but the latch ignored it. Closing the
modal reset the latch, and by then the cache held the fresh list, so the second click worked.

Cancelling restores `isCompleted` to false in the same request transaction, so the server was
always correct; this was purely a client cache problem.

The "click quickly" part is React Query's default 5 minute `cacheTime`. Switching to the
dispensed medications list unmounts the query observer, so a slow enough return let the cache
entry be garbage-collected and the modal fetched from scratch.

## Changes

- The modal waits for the dispensable query to settle before building its list, and shows its
  loading state until then. Once built, the table stays up so a background refetch still can't
  disturb an in-progress edit.
- Cancelling a dispense, editing a dispense, and deleting a medication request each invalidate
  `dispensableMedications` — from both the dispensed medications list and the patient's
  medication tab.
- `useDispensableMedicationsQuery` spread caller options before `enabled`, so passing
  `enabled` dropped the patient/facility guard and the query could fire with no patient.
  Fixed inline.
