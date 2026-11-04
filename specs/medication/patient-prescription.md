---
id: PTRX
---

# Patient prescriptions from active requests

A pharmacist creates a prescription for a patient who has no active encounter, directly from the Active medication requests screen. The prescription goes straight to pharmacy as an outpatient/discharge request.

## Entry point

- [ ] The Active medication requests screen has a **New prescription** button in its top bar, matching the **Add new patient** button on the patient listing.
- [ ] The button is shown only to users with permission to create encounters, prescriptions and medication requests.
- [ ] Selecting the button opens the **New prescription** modal with an empty form.

## Choosing the patient

- [ ] The modal's first field is a required **Patient** field, searched the same way as the Mother and Father fields on patient details.
- [ ] Each result shows the patient's name, display ID, sex and date of birth.
- [ ] Deceased patients are left out of the results.
- [ ] Patients with an active encounter are listed but greyed out and cannot be selected.
- [ ] Hovering over a patient with an active encounter shows the tooltip "Patient has an active encounter. Please prescribe medication within the encounter".
- [ ] Once a patient is chosen, the patient's allergies warning shows above the medication field, as it does when prescribing within a patient record.
- [ ] Clearing the patient field removes the allergies warning.

## Prescription form

- [ ] Apart from the patient field, the active request message and the pharmacy fields below, the form is the same prescription form used elsewhere.
- [ ] When the chosen patient already has an active medication request for the selected medication, a message below the medication field reads "Please be aware that this patient already has an active request for this medication. Double check that this is clinically appropriate". It is styled like the message shown when a medication has already been prescribed in an encounter.
- [ ] The message is checked once both a patient and a medication are chosen, and again whenever either changes.
- [ ] **Ongoing medication** is unticked by default and can be changed.
- [ ] **Send to pharmacy** is ticked and cannot be changed.
- [ ] **Prescription type** shows both options, with **Outpatient/Discharge** selected and **Inpatient** greyed out. Neither can be changed.
- [ ] **Dispensing quantity** is required, as for any prescription sent to pharmacy.
- [ ] The repeats field is labelled **Repeats**.
- [ ] **Finalise & Print** finalises the prescription and opens the prescription for printing, as it does within an encounter.

## Finalising

- [ ] Finalising records the prescription in an automatic **Medication dispensing** clinic encounter that starts and ends at the time of finalising, at the facility's configured automatic encounter location and department. It is the same kind of encounter created when ongoing medications are sent to pharmacy.
- [ ] Finalising sends the prescription to pharmacy as an outpatient/discharge request, ordered by the prescription's prescriber.
- [ ] A prescription marked as ongoing is also added to the patient's ongoing medications.
- [ ] After finalising, the modal closes and the new request appears in the active medication requests list.
- [ ] If the patient has gained an active encounter by the time the prescription is finalised, it is refused with the same message shown in the patient tooltip.
- [ ] If the facility has no automatic encounter location or department configured, finalising is refused with a message naming the missing setting.
