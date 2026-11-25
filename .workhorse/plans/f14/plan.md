# Plan

## Design notes

### Patient details from the IPS modal

The IPS modal's "patient's details" link opens a patient details modal over the IPS modal, rather than closing it and navigating to the patient's Details tab. A saved change to the date of birth then shows in the IPS modal's date of birth box straight away, so the user can check it and carry on sending or downloading.

The modal is the one #W11 adds for invoicing: the Details tab's sections, fields and validation in a modal, with Cancel and Save, a discard confirmation for unsaved edits, and a read-only form with a single Close button for users who cannot edit patient records. It shows the Details tab as it stands on the default branch, so it carries no Billing information section. Building this means reusing that modal once W11 lands, or landing it here first, so the two cards are sequenced together.

The IPS form's patient email is set when the IPS modal opens. Saving a new email address in the patient details modal does not change the address already in the IPS form.

### PDF section order

After the patient details and summary details, the PDF's sections run: Active problems, Allergies and intolerances, Medication summary, Immunisations, Diagnostic results, then Vitals.

### QR code in the PDF

The PDF carries the same QR code the IPS email attaches, beside the summary details. That QR code does not hold the IPS JSON itself, which is far too large for a QR code. It holds a SMART Health Link: the IPS viewer's address, followed by a payload naming where the encrypted IPS bundle sits in S3 and the key that decrypts it (`IPSRequestProcessor` on the central server builds it).

So downloading the PDF has to do what sending the email does first: generate the bundle, encrypt it, upload it to S3 and build the link. The email path does that in a queued central server task, while a download needs it on demand and the user is waiting for the file. The download therefore goes through the central server. When the facility cannot reach it the download does not start, and the user is told the IPS cannot be downloaded until the connection returns. Download PDF does not depend on the email fields. Each download also leaves a new long-term link in S3, as each email does.

### Vitals in the PDF

The PDF has a Vitals table listing the most recent value of each of these, recorded in the last 12 months: blood pressure panel, systolic BP, diastolic BP, heart rate, respiratory rate, body temperature, oxygen saturation, body height, body weight and BMI. Each row carries its observation code beside the vital sign's name, and its own date recorded, so height can come from an earlier visit than the rest. A vital with nothing recorded in the last 12 months is left out.

The IPS bundle gains a Vital Signs section (LOINC 8716-3) holding the same observations, so the PDF, the QR code's IPS and the emailed IPS all carry the same vitals. Vitals come from the vitals survey's fixed data elements, which cover everything listed except BMI.

Each vital's observation code is held in reference data. Which reference data type holds it is still to be confirmed: no type in the importable reference data on this branch or on main carries vitals codes, and the codes appear nowhere in the codebase. The mockup shows each vital's LOINC code.

BMI is calculated from the most recent height and weight in the last 12 months, rather than read from a deployment's own calculated BMI question, so every deployment shows it. Its date recorded is the later of the two readings'. With no height or no weight in that window, BMI is left out.

### Diagnostic results in the PDF

A Diagnostic results section follows Vitals, with a Laboratory table and a Radiology table, each holding the most recent results recorded in the last 12 months. Like vitals, these belong in the IPS bundle too, as its Results section (LOINC 30954-2).

Laboratory columns map to Tamanu as:

- **Status**: the lab request's status
- **Test name** and **Observation code**: the lab test type's name and external code, or the lab test panel's name and external code for a panel row. The external code is the one FHIR lab results already match on; the plain code is Tamanu's own
- **Date sample collected**: the lab request's sample time
- **Performed by**: the lab test's laboratory officer
- **Result**: the lab test's result, with the test type's unit when the result is numeric
- **Reference range**: the lab test's own reference range where it has one, otherwise the test type's range for the patient's sex, or its range text
- **Interpretation**: the lab request's results interpretation, the conclusion SENAITE sends on its diagnostic report. It is free text and belongs to the whole request, so it sits on a panel row rather than on the panel's tests, and on the row of a test requested alone. Blank where the lab sent none

The lab table groups its rows the way Tamanu's lab results table and lab results printout do, under bold full-width rows: a Panels row with every panel beneath it, then an Individual tests row with every test requested on its own. Each panel is a bold row carrying the panel's status, date, performer and interpretation, with its tests in plain rows beneath it. Test names are not indented, under a panel or a group row; the panel's bold row is what sets its tests apart. Unlike the lab results printout, which indents the first column under a section row, every cell keeps the table's standard padding. A group with nothing in it is left out. The lab results printout's section rows (`getRowSectionLabel` in `Table.jsx`) are the pattern to reuse, though they label each panel by name rather than gathering panels under one Panels row.

"Most recent" is per test type: each test appears once, with its latest result from the last 12 months, whether it came in a panel or alone. A panel row shows only the tests whose latest result came from that panel, and is left out when none did.

Interim results are included as well as final ones, with the Status column showing which. For labs that is any request with a result recorded whose status is Interim results, To be verified, Verified or Published. For radiology it is any request with a result recorded, whether still In progress or Completed, since an imaging result can be added before the request is completed. A request with no result yet (Reception pending, Results pending, or imaging Pending) is left out, as are cancelled, deleted and entered-in-error requests.

Radiology columns map to Tamanu as:

- **Status**: the imaging request's status
- **Imaging type**: the request's imaging type
- **Area to be imaged** and **Observation code**: the request's areas and each area's external code, one line per area
- **Imaging date**: the imaging result's completed date
- **Reported by**: the user who completed the imaging result
- **Results**: the imaging result's description

### Allergies in the PDF

The Allergies and intolerances table shows each allergy with its reaction and date recorded, from the patient allergy's reaction and recorded date. Either is blank where the allergy has none. The IPS bundle's allergy entries carry neither yet, so they gain both (the AllergyIntolerance's `reaction.manifestation` and `recordedDate`), keeping the PDF and the QR code's IPS in step.

### Medications in the PDF

The Medications table's columns map to Tamanu as:

- **Medication** and **Code**: the drug's name and reference data code, the same code the IPS bundle's medication statements already carry
- **Dose**: the prescription's dose amount and dosing unit
- **Frequency**: the prescription's frequency, in Tamanu's own labels (Daily, Two times daily, and so on)
- **Frequency schedule**: the prescription's administration times, one per line, as set when it was prescribed (for example 8:00 AM and 8:00 PM for Two times daily). Blank for a frequency with no set times, such as Immediately or As directed
- **Route** and **Start date**: the prescription's route and start date
- **Notes**: the prescription's notes. Pharmacy notes are not included

The IPS bundle builds its dosage from the morning, lunch, evening and night quantities rather than the frequency and administration times. To keep the PDF and the QR code's IPS in step, the bundle's dosage gains the frequency, the administration times (as the timing's times of day) and the notes.
