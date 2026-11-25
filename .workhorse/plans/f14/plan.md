# Plan

## Design notes

### Patient details from the IPS modal

The IPS modal's "patient's details" link opens a patient details modal over the IPS modal, rather than closing it and navigating to the patient's Details tab. A saved change to the date of birth then shows in the IPS modal's date of birth box straight away, so the user can check it and carry on sending or downloading.

The modal is the one #W11 adds for invoicing: the Details tab's sections, fields and validation in a modal, with Cancel and Save, a discard confirmation for unsaved edits, and a read-only form with a single Close button for users who cannot edit patient records. It shows the Details tab as it stands on the default branch, so it carries no Billing information section. Building this means reusing that modal once W11 lands, or landing it here first, so the two cards are sequenced together.

The IPS form's patient email is set when the IPS modal opens. Saving a new email address in the patient details modal does not change the address already in the IPS form.

### QR code in the PDF

The PDF carries the same QR code the IPS email attaches, beside the summary details. That QR code does not hold the IPS JSON itself, which is far too large for a QR code. It holds a SMART Health Link: the IPS viewer's address, followed by a payload naming where the encrypted IPS bundle sits in S3 and the key that decrypts it (`IPSRequestProcessor` on the central server builds it).

So downloading the PDF has to do what sending the email does first: generate the bundle, encrypt it, upload it to S3 and build the link. The email path does that in a queued central server task, while a download needs it on demand and the user is waiting for the file. The download therefore goes through the central server, and how it behaves when the facility cannot reach the central server needs settling before build. Each download also leaves a new long-term link in S3, as each email does.

### Vitals in the PDF

The PDF has a Vitals table listing the most recent value of each of these, recorded in the last 12 months: blood pressure panel, systolic BP, diastolic BP, heart rate, respiratory rate, body temperature, oxygen saturation, body height, body weight and BMI. Each row carries its own date recorded, so height can come from an earlier visit than the rest. A vital with nothing recorded in the last 12 months is left out.

The IPS bundle gains a Vital Signs section (LOINC 8716-3) holding the same observations, so the PDF, the QR code's IPS and the emailed IPS all carry the same vitals. Vitals come from the vitals survey's fixed data elements, which cover everything listed except BMI.

BMI is calculated from the most recent height and weight in the last 12 months, rather than read from a deployment's own calculated BMI question, so every deployment shows it. Its date recorded is the later of the two readings'. With no height or no weight in that window, BMI is left out.

### Diagnostic results in the PDF

A Diagnostic results section follows Vitals, with a Laboratory table and a Radiology table, each holding the most recent results recorded in the last 12 months. Like vitals, these belong in the IPS bundle too, as its Results section (LOINC 30954-2).

Laboratory columns map to Tamanu as:

- **Status**: the lab request's status
- **Test name** and **Observation code**: the lab test type's name and code, or the lab test panel's name and code for a panel row
- **Date sample collected**: the lab request's sample time
- **Performed by**: the lab test's laboratory officer
- **Result**: the lab test's result, with the test type's unit when the result is numeric
- **Reference range**: the lab test's own reference range where it has one, otherwise the test type's range for the patient's sex, or its range text
- **Interpretation**: the lab request's results interpretation, the conclusion SENAITE sends on its diagnostic report. It is free text and belongs to the whole request, so it sits on a panel row rather than on the panel's tests, and on the row of a test requested alone. Blank where the lab sent none

A panel shows as a shaded row carrying the panel's status, date and performer, with its tests beneath it, indented. A test requested on its own is a single row.

"Most recent" is per test type: each test appears once, with its latest result from the last 12 months, whether it came in a panel or alone. A panel row shows only the tests whose latest result came from that panel, and is left out when none did. Which lab and imaging statuses count (only Published and Completed, or interim results too) is still open.

Radiology columns map to Tamanu as:

- **Status**: the imaging request's status
- **Imaging type**: the request's imaging type
- **Area to be imaged** and **Observation code**: the request's areas and each area's external code, one line per area
- **Imaging date**: the imaging result's completed date
- **Reported by**: the user who completed the imaging result
- **Results**: the imaging result's description
