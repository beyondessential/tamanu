---
id: IPS
---

# International Patient Summary

Applies to a patient's International Patient Summary (IPS): the modal it is emailed and downloaded from, the QR code that opens it, the PDF a user downloads, and what each of its sections holds.

## The IPS modal

- The patient resources modal offers an International Patient Summary tile captioned "Email or download the IPS", which opens the International Patient Summary modal.
- The modal shows the patient's date of birth and explains that the patient enters it to log in to the IPS portal, so it needs to be correct before the IPS is sent or downloaded.
- The modal's "patient's details" link opens the patient details modal over the IPS modal. A date of birth saved there shows in the IPS modal straight away, and closing the patient details modal returns the user to the IPS modal as they left it.
- The patient email field starts with the email address on the patient's record. Saving a different address in the patient details modal leaves the IPS form's address as it is.
- Beneath the date of birth, a "Would you like to download the patient summary as a PDF?" row offers a Download PDF button.
- The email fields sit below the download row, with Cancel and Send in the modal's footer.

## Emailing the IPS

- Send needs a valid patient email address, entered twice to match.
- Sending queues the IPS to be emailed to that address, with its QR code attached, and closes the modal.
- The email tells the patient to scan the attached QR code to view their IPS, and gives the same link as text.

## Downloading the IPS as a PDF

- Download PDF works whether or not the email fields are filled in.
- The PDF is generated from the patient's record at the moment of download, and the user's browser saves it as a file.
- A download needs the central server. When the facility cannot reach it, the download does not start and the user is told the IPS cannot be downloaded until the connection returns.

## The QR code

- The emailed IPS and the downloaded PDF each carry a QR code that opens the IPS in the IPS viewer.
- The QR code holds a SMART Health Link to a copy of the IPS that is encrypted and stored online, with the key that decrypts it, rather than the IPS itself.
- Every email and every download stores a fresh copy of the IPS and gives it its own link.

> [!NOTE]
> A full IPS is far too large to fit in a QR code, which is why the code carries a link and a key rather than the summary.

## The PDF

- The PDF follows the layout of Tamanu's other patient PDFs: the letterhead and the title "International Patient Summary" on the first page, and a footer on every page with the print date and time, who printed it, and the page number.
- A Patient details section shows the patient's first name, last name, date of birth with age, address, patient ID, sex and contact number.
- A Summary details section shows the date generated, the author and the attesting organisation, with the QR code beside them.
- The clinical sections follow in this order: Active problems, Allergies and intolerances, Medication summary, Immunisations, Diagnostic results, then Vitals.
- Each clinical section is a table, and every table's content is set in one type size.
- A section with nothing to show says so in a single line, using the same wording as the IPS: for example "No known allergies" or "No information about problems".
- The PDF and the IPS the QR code opens hold the same information in every section.

## Section content

### Active problems

- Every condition on the patient's record, with its status (Active or Resolved) and, for a resolved condition, its resolution date.

### Allergies and intolerances

- Every allergy on the patient's record, with its reaction and the date it was recorded. Either is blank where the allergy has none.

### Medication summary

- The medications prescribed in the patient's open encounter, leaving out sensitive medications.
- Each medication shows its name, its code from reference data, dose, frequency, frequency schedule, route, start date and notes.
- The frequency uses Tamanu's [administration frequency](../medication/administration-frequencies.md) labels.
- The frequency schedule lists the administration times set when the medication was prescribed, one per line, and is blank for a frequency with no set times.
- The notes are the prescription's notes.

### Immunisations

- Every vaccine recorded for the patient, with its date and its status.

### Diagnostic results

- Diagnostic results has a Laboratory table and a Radiology table.
- Each holds the most recent results recorded in the last 12 months, final and interim, with a status column showing which.

#### Laboratory

- Lab results are included once a result has been recorded and the request is at Interim results, To be verified, Verified or Published.
- Each test type appears once, with its latest result, whether it was requested in a panel or on its own.
- The table's columns are status, test name, observation code, date sample collected, performed by, result, reference range and interpretation.
- The observation code is the test type's external code, or the panel's external code on a panel row.
- A numeric result shows with its unit. The reference range is resolved as the [lab results](../labs/results.md#reference-range-resolution) do.
- Performed by is the lab officer recorded on the test.
- Rows are grouped under full-width headings: a Panels heading with every panel beneath it, then an Individual tests heading with every test requested on its own. A heading with nothing under it is left out.
- Each panel is a bold row carrying the panel's name, code, status, sample date, lab officer and interpretation, with its tests in plain rows beneath it.
- A panel shows only the tests whose latest result came from that panel, and is left out when none did.
- Test names line up with the rest of the column, with no indent under a panel or heading.
- The interpretation is the results interpretation the lab sent for the whole request. It shows on the panel row, or on the row of a test requested on its own, and is blank where the lab sent none.

#### Radiology

- Imaging results are included once a result has been recorded, whether the request is In progress or Completed.
- The table's columns are status, imaging type, area to be imaged, observation code, imaging date, reported by and results.
- A request covering several areas lists each area on its own line, with each area's external code beside it.
- The imaging date is when the result was completed, reported by is the user who completed it, and the results are its description.

### Vitals

- Vitals lists the most recent value recorded in the last 12 months for each of: blood pressure panel, systolic BP, diastolic BP, heart rate, respiratory rate, body temperature, oxygen saturation, body height, body weight and BMI.
- Each row shows the vital sign, its observation code from reference data, its value with its unit, and the date it was recorded. Each row carries its own date, so one vital can come from an earlier visit than the rest.
- BMI is calculated from the most recent height and weight in the last 12 months, and takes the later of their two dates. It is left out when either is missing from that period.
- A vital with nothing recorded in the last 12 months is left out.

> [!NOTE]
> BMI is calculated rather than read from a deployment's own vitals form, so it shows at every deployment whether or not its form records BMI.

## Borrowed terms

- [International Patient Summary](https://build.fhir.org/ig/HL7/fhir-ips/): HL7 FHIR standard for a minimal, specialty-agnostic summary of a patient's health record, meant to be shared across borders.
- [SMART Health Link](https://docs.smarthealthit.org/smart-health-links/spec/): a link, often shared as a QR code, that lets its holder retrieve encrypted health information and the key to decrypt it.
