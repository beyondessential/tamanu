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
