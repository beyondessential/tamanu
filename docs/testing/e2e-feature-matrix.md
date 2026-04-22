# Tamanu E2E Feature Matrix

This matrix maps key user-facing features to current Playwright coverage in `packages/e2e-tests/tests`.

## How to use this matrix

- Treat this as **journey coverage**, not line/branch code coverage.
- Keep rows at the **feature/journey** level (do not add one row per test case).
- Update the "Coverage depth" value when adding assertions:
  - `happy-path` = core flow works
  - `validation` = required fields and invalid input checks
  - `permissions` = role-based allow/deny behavior
  - `edge-cases` = retries, cancellations, sorting, pagination, etc.

## Matrix

| Feature area | Journey covered | Primary spec(s) | Coverage depth | Notes / known gaps |
| --- | --- | --- | --- | --- |
| Basic patient workflows | Admit, edit patient, add tasks, diagnosis, referral, simple charting | `tests/basic/Basic.spec.ts` | happy-path, partial edge-cases | Several scenarios in this file are currently skipped |
| Patient list | All patients table behavior | `tests/patients/allPatientsTable.spec.ts` | happy-path, edge-cases | Keep aligned with sorting/filtering requirements |
| Recently viewed patients | Ordering, navigation, pagination, color indicators | `tests/patients/recentlyViewedPatients.spec.ts` | happy-path, edge-cases | Good candidate for explicit permission checks |
| Patient details | Core details page interactions | `tests/patients/details/detail.spec.ts` | happy-path | Add permission-denied scenarios if needed |
| Reminder contacts | Contact reminder details workflows | `tests/patients/details/reminderContact.spec.ts` | happy-path, validation | Confirm negative/permission paths |
| Patient sidebar | Conditions, allergies, family history, warnings, care plans | `tests/patients/patientSideBar.spec.ts` | happy-path, validation, edge-cases | No explicit role matrix yet |
| Notes | Create/edit/filter/view change logs | `tests/patients/note.spec.ts` | happy-path, validation, edge-cases | Add permission coverage for restricted roles |
| Documents | Add/view/download patient documents | `tests/patients/document.spec.ts` | happy-path | Add invalid file/upload error cases |
| Lab requests (patient) | Panel/individual requests, status changes, results | `tests/patients/labRequest.spec.ts` | happy-path, validation, edge-cases | Good depth already; add explicit permission-denied checks |
| Lab requests (module) | Lab request workflows from dedicated area | `tests/labRequests/labRequest.spec.ts` | happy-path | Clarify overlap with patient lab request suite |
| Imaging | Imaging request creation and management | `tests/imaging/imaging.spec.ts`, `tests/patients/history/encounter/imaging.spec.ts` | happy-path | Add cancellation/error handling if missing |
| Procedures | Procedure creation, validation, discard flow | `tests/patients/procedure.spec.ts` | happy-path, validation, edge-cases | Add permission checks for restricted roles |
| Vaccines | Routine/catchup/campaign/other, edit/delete, validation, sorting | `tests/patients/vaccine/vaccine.spec.ts`, `tests/patients/vaccine/scheduledVaccine.spec.ts` | happy-path, validation, edge-cases | Broadly covered; keep scenario pruning under control |
| Immunisation | Immunisation-specific flows | `tests/Immunisation/immunisation.spec.ts` | happy-path | Confirm naming consistency (`Immunisation/` folder) |
| Medication | Medication tab and prescribing | `tests/medication/medication.spec.ts`, `tests/patients/medication.spec.ts`, `tests/patients/history/encounter/medication.spec.ts` | minimal | Several tests are placeholder-level and need expansion |
| Outpatient | Outpatient workflows | `tests/patients/outpatient.spec.ts`, `tests/scheduling/outpatient.spec.ts`, `tests/patients/history/outpatientAppointment.spec.ts` | happy-path | Add explicit reschedule/cancel edge-cases |
| Inpatient / bed management | Admission, location/bed movement | `tests/patients/inpatient.spec.ts`, `tests/patients/history/encounter/bedManagement.spec.ts` | happy-path | Add multi-role assertions |
| Referrals | Create/manage referral journeys | `tests/patients/referral.spec.ts` | happy-path | Expand validation + denied-role cases |
| Encounter history | Encounter-level diagnosis, vitals, tasks, docs, labs, imaging | `tests/patients/history/encounter/diagnosis.spec.ts`, `tests/patients/history/encounter/vitals.spec.ts`, `tests/patients/history/encounter/task.spec.ts`, `tests/patients/history/encounter/document.spec.ts`, `tests/patients/history/encounter/lab.spec.ts` | happy-path, partial edge-cases | Consider splitting by risk-critical journeys for ownership |
| Patient history | Location booking and history timeline | `tests/patients/history/patientHistory.spec.ts`, `tests/patients/history/locationBooking.spec.ts`, `tests/scheduling/locationBooking.spec.ts` | happy-path, edge-cases | Validate timezone-sensitive assertions |
| Emergency patients | Emergency admission/triage flows | `tests/patients/emergencyPatient.spec.ts` | happy-path | Add escalation/error paths if required |
| Program registry | Registration and related workflows | `tests/programRegistry/programRegistry.spec.ts`, `tests/patients/programRegistry.spec.ts` | happy-path | Add coverage for role restrictions |
| IPS | IPS-related journeys | `tests/ips/ips.spec.ts` | happy-path | Add deeper validation scenarios as needed |
| Page-level smoke | Generic page behavior smoke test | `tests/page.spec.ts` | minimal | Keep fast and stable as broad smoke only |

## Suggested maintenance workflow

- On each E2E PR, update this file if a new feature area is added or coverage depth changes.
- Every sprint, review rows marked `minimal` and promote at least one to stronger depth.
- Pair this matrix with Playwright HTML report (`playwright-report/index.html`) for failure details.
