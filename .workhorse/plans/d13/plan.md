# Add patient prescription from Active requests

## Design decisions

- The **Add patient prescription** button sits at the right of the Active medication requests top bar, matching **Add new patient** on Patient listing (outlined, + icon)
- It opens the existing **New prescription** modal with a required **Patient** field at the top, using the same patient suggester and option format as the Mother/Father fields
- Deceased patients are left out of the patient results. Patients with an active encounter are listed but disabled, with the tooltip "Patient has an active encounter. Please prescribe medication within the encounter"
- **Send to pharmacy** is ticked and locked, with a grey tick and the standard light grey outline
- **Ongoing medication** stays editable here and is not forced on, unlike prescribing outside an encounter from the patient's medication pane
- **Prescription type** is fixed to **Outpatient/Discharge**, selected and locked with the standard light grey outline, since there is no encounter to make it inpatient. **Inpatient** is still shown, greyed out and not selectable
- Once a patient is chosen, the form behaves as it does without an encounter: the patient's allergies warning shows, and the repeats field is labelled **Repeats** rather than **Repeats on discharge**

## Technical notes

- `MedicationForm` currently reads the patient from the store and only allows Send to pharmacy when there is an `encounterId` (`canSendToPharmacy`). Both need to accept a patient chosen in the form with no encounter
