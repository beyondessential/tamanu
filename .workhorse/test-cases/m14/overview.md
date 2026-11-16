# Triage started from an appointment

## Automated

- [x] The triage form creates the triage before calling `onSubmitEncounter`, and passes it the encounter the triage created
- [x] A triage that fails to save does not call `onSubmitEncounter`

## Manual (outpatient appointments popup)

- [x] Admit or check in > Triage > Submit: "Admit or check in" turns grey straight away, with the "Patient already admitted" tooltip, without closing the popup
- [x] The appointment is linked to the new emergency encounter (it shows as the appointment's encounter after a refresh)
- [x] A triage refused by the server (for example, an arrival time in the future) shows the error, and no "Encounter successfully started" toast appears
- [x] Admit or check in > Hospital admission or Clinic still links the appointment and greys the button out
- [x] Starting a triage from the patient page (not an appointment) still redirects to the emergency department list
