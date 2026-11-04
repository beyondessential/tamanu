# Add patient prescription from Active requests

## Design decisions

- The **Add patient prescription** button sits at the right of the Active medication requests top bar, matching **Add new patient** on Patient listing (outlined, + icon)
- It opens the existing **New prescription** modal with a required **Patient** field at the top, using the same patient suggester and option format as the Mother/Father fields
- Deceased patients are left out of the patient results. Patients with an active encounter are listed but disabled, with the tooltip "Patient has an active encounter. Please prescribe medication within the encounter"
- **Send to pharmacy** is ticked and locked, with a grey tick and the standard light grey outline
- **Ongoing medication** stays editable here and is not forced on, unlike prescribing outside an encounter from the patient's medication pane
- **Prescription type** is fixed to **Outpatient/Discharge**, selected and locked with the standard light grey outline, since there is no encounter to make it inpatient. **Inpatient** is still shown, greyed out and not selectable
- Once a patient is chosen, the form behaves as it does without an encounter: the patient's allergies warning shows, and the repeats field is labelled **Repeats** rather than **Repeats on discharge**

- Finalising records the prescription in an automatic, already-ended **Medication dispensing** clinic encounter at the facility's automatic encounter location and department, as `POST /medication/send-ongoing-to-pharmacy` already does
- A prescription ticked as ongoing is also added to the patient's ongoing medications

## Technical notes

- `MedicationForm` currently reads the patient from the store and only allows Send to pharmacy when there is an `encounterId` (`canSendToPharmacy`). Both need to accept a patient chosen in the form with no encounter
- The new endpoint can reuse the automatic encounter creation in `send-ongoing-to-pharmacy` (active-encounter check, settings checks, invoice creation) and `createPharmacyOrder` with `isDischargePrescription: true`
- Permissions follow `send-ongoing-to-pharmacy`: create `Encounter`, create `Medication`, create `MedicationRequest`, read `Medication`, plus the sensitive-medication check
- The automatic encounter location and department settings describe themselves as for the ongoing medications table only. Their descriptions need widening to cover this flow
- An ongoing prescription normally reaches the patient's ongoing medications at discharge. The automatic encounter has no discharge step, so this endpoint has to create the `PatientOngoingPrescription` link itself
- The patient suggester needs to exclude deceased patients and flag those with an active encounter, so the field can disable them
