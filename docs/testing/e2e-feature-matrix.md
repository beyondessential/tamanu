# Tamanu E2E Feature Matrix

This matrix maps key user-facing features to current Playwright coverage in `packages/e2e-tests/tests`.

## How to use this matrix

- Treat this as **journey coverage**, not line/branch code coverage.
- Keep rows at the **feature/journey** level (do not add one row per test case).

## Matrix

### Main views

| Feature area | Journey covered | Primary spec(s) |
| --- | --- | --- |
| Patient list | All patients table behavior | `tests/patients/allPatientsTable.spec.ts` |
| Recently viewed patients | Ordering, navigation, pagination, color indicators | `tests/patients/recentlyViewedPatients.spec.ts` |
| Outpatient scheduling | Outpatient scheduling workflows | `tests/scheduling/outpatient.spec.ts` |
| Location booking | Scheduling/location booking workflows | `tests/scheduling/locationBooking.spec.ts` |
| Program registry | Registration and related workflows | `tests/programRegistry/programRegistry.spec.ts`, `tests/patients/programRegistry.spec.ts` |
| Page-level smoke | Generic page behavior smoke test | `tests/page.spec.ts` |

### Patient-level views

| Feature area | Journey covered | Primary spec(s) |
| --- | --- | --- |
| Basic patient workflows | Admit, edit patient, add tasks, diagnosis, referral, simple charting | `tests/basic/Basic.spec.ts` |
| Patient details | Core details page interactions | `tests/patients/details/detail.spec.ts` |
| Reminder contacts | Contact reminder details workflows | `tests/patients/details/reminderContact.spec.ts` |
| Patient sidebar | Conditions, allergies, family history, warnings, care plans | `tests/patients/patientSideBar.spec.ts` |
| Notes | Create/edit/filter/view change logs | `tests/patients/note.spec.ts` |
| Documents | Add/view/download patient documents | `tests/patients/document.spec.ts` |
| Referrals | Create/manage referral journeys | `tests/patients/referral.spec.ts` |
| Procedures | Procedure creation, validation, discard flow | `tests/patients/procedure.spec.ts` |
| Vaccines | Routine/catchup/campaign/other, edit/delete, validation, sorting | `tests/patients/vaccine/vaccine.spec.ts`, `tests/patients/vaccine/scheduledVaccine.spec.ts` |
| Immunisation | Immunisation-specific flows | `tests/Immunisation/immunisation.spec.ts` |
| Lab requests (patient) | Panel/individual requests, status changes, results | `tests/patients/labRequest.spec.ts` |
| Medication (patient tab) | Medication tab and prescribing journeys | `tests/patients/medication.spec.ts`, `tests/medication/medication.spec.ts` |
| Imaging (patient context) | Imaging request creation and management | `tests/imaging/imaging.spec.ts` |
| Emergency patients | Emergency admission/triage flows | `tests/patients/emergencyPatient.spec.ts` |
| Patient history (overview) | History timeline and patient-level navigation | `tests/patients/history/patientHistory.spec.ts`, `tests/patients/history/locationBooking.spec.ts`, `tests/patients/history/outpatientAppointment.spec.ts` |

### Encounter-level views

| Feature area | Journey covered | Primary spec(s) |
| --- | --- | --- |
| Inpatient / bed management | Admission, location/bed movement | `tests/patients/inpatient.spec.ts`, `tests/patients/history/encounter/bedManagement.spec.ts` |
| Encounter history | Encounter-level diagnosis, vitals, tasks, docs, labs, imaging | `tests/patients/history/encounter/diagnosis.spec.ts`, `tests/patients/history/encounter/vitals.spec.ts`, `tests/patients/history/encounter/task.spec.ts`, `tests/patients/history/encounter/document.spec.ts`, `tests/patients/history/encounter/lab.spec.ts`, `tests/patients/history/encounter/imaging.spec.ts` |
| Medication (encounter context) | Prescribing and medication workflow within encounters | `tests/patients/history/encounter/medication.spec.ts` |

### Shared module views

| Feature area | Journey covered | Primary spec(s) |
| --- | --- | --- |
| Lab requests (module) | Lab request workflows from dedicated module area | `tests/labRequests/labRequest.spec.ts` |
| IPS | IPS-related journeys | `tests/ips/ips.spec.ts` |

## Suggested maintenance workflow

- On each E2E PR, update this file if a new feature area is added or journey/spec mapping changes.
- Every sprint, review feature rows to confirm they still reflect current spec ownership.
- Pair this matrix with Playwright HTML report (`playwright-report/index.html`) for failure details.
