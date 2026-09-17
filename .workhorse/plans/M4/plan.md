# Rejected lab requests — implementation plan

Implements `specs/labs/rejected-requests.md` (LREJ). The SENAITE `cancelled` →
`REJECTED` mapping and the "rejected is terminal / not manually settable" rules
already exist, so the build is four small changes plus tests: fire a notification
on rejection, give it drawer copy, surface rejected in the finalised listing (data
+ a new status filter), and relabel the printout button to "Rejection report".

Notification copy (Figma node `23570-20135`): "Lab sample for [name] ([NHN]) has
been **rejected**". Published → Rejected can't happen, so the drawer's
`previousStatus === PUBLISHED` "amended" override is not a concern.

**Status:** implemented on `feat/M4/rejected-lab-request-notification` (based on
`epic-labs-enhancements`, which carries the status-filter and finalised-listing
infra `main` lacks). Lint-clean; the backend notification test passes. Two
decisions made during the build, both noted inline below: the printout button had
to be re-enabled for rejected (it was disabled as a hidden status), and web unit
tests were skipped as there's no existing harness for these components.

## Notification trigger (backend)

`packages/database/src/models/LabRequest/hooks.ts` — `pushNotificationAfterUpdateHook`

- [x] Add `LAB_REQUEST_STATUSES.REJECTED` to the `NOTIFICATION_STATUSES` array
      (currently `[INTERIM_RESULTS, PUBLISHED, INVALIDATED]`, ~line 85). This is
      the whole trigger change — recipient (`requestedById`), metadata, patient
      lookup and sync all already flow through `Notification.pushNotification`.
- [x] Confirm the FHIR ingestion path that sets `REJECTED`
      (`FhirDiagnosticReport.pushUpstream` → lab request `.update`) goes through
      the model `afterUpdate` instance hook, so the notification fires. Invalidated
      already relies on this same path, so it should; verify with the backend test
      below rather than by eye.

## Notification drawer copy (web)

`packages/web/app/components/Notification/NotificationDrawer.jsx` — `getNotificationText`

- [x] Add a `case LAB_REQUEST_STATUSES.REJECTED:` to the lab-request switch
      (~line 56) returning `getTranslation('notification.content.labRequest.rejected',
      'Lab sample for :patientName (:displayId) has been <strong>rejected</strong>',
      { replacements: { displayId, patientName } })`. Mirror the invalidated case.
- [x] Icon needs no change — `NOTIFICATION_ICONS[LAB_REQUEST]` is already the labs
      icon shown in the mock.

## Finalised listing — data + status filter (web + constants)

- [x] `packages/constants/src/labs.ts`: add `LAB_REQUEST_STATUSES.REJECTED` to the
      `COMPLETED` grouping (~line 118) so the finalised listing's query includes
      rejected requests. Grep `LAB_REQUEST_TABLE_STATUS_GROUPINGS.COMPLETED` usage
      first to confirm the grouping only drives that listing and adding rejected
      has no unwanted side effect.
- [x] `packages/web/app/components/SearchBar/LabRequestsSearchBar.jsx`: give the
      finalised listing a Status filter offering **Published, Invalidated,
      Rejected**. The active listing builds `statusFilterOptions` by excluding
      terminal statuses; the finalised listing needs the opposite set — define a
      `FINALISED_STATUS_FILTER_OPTIONS = [PUBLISHED, INVALIDATED, REJECTED]` and
      pick the option set by `publishedStatus`.
- [x] Render the Status `MultiAutocompleteField` on the finalised branch. Kept it
      additive (rather than reworking the layout, which the finalised-redesign
      sibling card owns): Status renders unconditionally, and Laboratory stays in
      the primary row for the finalised listing (`publishedStatus && <Laboratory>`).
      No change to `PUBLISHED_ADVANCED_FIELDS`.
- [x] Verify the lab requests list endpoint applies the `status` filter param on
      top of the `statuses` grouping for the finalised listing (the active listing
      already sends both, so the query supports it) — check
      `LabRequestsTable.jsx` sends `status` and the facility route honours it.

## Rejection report button relabel (web)

`packages/web/app/views/patients/LabRequestView.jsx`

- [x] Add `const isRejected = labRequest.status === LAB_REQUEST_STATUSES.REJECTED;`
      alongside `isPublished`/`isVerified` (~line 265).
- [x] In the printout button's else branch (~line 356, the `MODAL_IDS.PRINT` /
      "Print request" button), show "Rejection report" when `isRejected`:
      `lab.action.rejectionReport` / fallback "Rejection report". Keep the same
      `MODAL_IDS.PRINT` action — only the label changes.

## Tests

- [x] Backend: transitioning a lab request to `REJECTED` creates one `Notification`
      of type `LAB_REQUEST` for the requesting clinician with the rejected metadata.
      Locate the existing invalidated/published notification hook test and mirror it.
- [ ] Web unit (not done — no existing test harness for these components): the
      rejected drawer copy, and the finalised search bar offering only the finalised
      statuses. The drawer/search-bar changes are direct mirrors of existing cases;
      left as a follow-up if the team wants component coverage added.
- [x] Lint changed files before pushing.

## Follow-ups / decisions

- [x] The printout button was `disabled={isHidden}`, and rejected is a hidden
      status, so the relabelled "Rejection report" button would have been disabled
      and the report unreachable. Changed to `disabled={isHidden && !isRejected}` so
      rejected keeps read-only everywhere else but this one button stays clickable.
- [ ] Rebase onto `origin/epic-labs-enhancements` (local base is ~21 commits behind
      origin) before opening the PR; watch for soft conflicts if the Published →
      Finalised rename card has already landed there.
