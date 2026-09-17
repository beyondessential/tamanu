The permissions required to prescribe, administer and manage medications in the Tamanu Medications
Module, and to view medications flagged as sensitive.

For the reference data these permissions act on see [Reference data](reference-data.md), and for the
module's settings see [Settings](settings.md).

---

# Permissions

See the Users configuration guide for more detail on roles and permissions in Tamanu.

## Prescriptions and ongoing medications

Required to prescribe a medication and manage the ongoing medications list:

- `list` for `Medication`
  - View a list of medications at the encounter level
  - View the ongoing medications list and last encounter discharge medications
  - View prescription details from any of the above views
- `read` for `Medication`
  - Print a prescription
- `write` for `Medication`
  - Pause and resume a medication
  - Discontinue a medication, including through the discharge workflow
  - Set discharge quantity and repeats for a medication
- `create` for `Medication`
  - Create a new prescription through an encounter
  - Add existing ongoing medications to an encounter
  - Create a new ongoing medication record through the patient-level ongoing medications table

## Sensitive medications

Required to view, manage and prescribe medications flagged as sensitive. See
[Sensitive medications](#sensitive-medications-supported-from-v239-onwards):

- `list` for `SensitiveMedication`
  - View a sensitive medication in a view that lists medications, being the encounter level medications
    table, the medication administration record, the print prescription modal, the discharge modal and
    the patient level medications table
- `read` for `SensitiveMedication`
  - View prescription details for a sensitive medication
  - View administration record details for a sensitive medication
- `write` for `SensitiveMedication`
  - Pause and resume a sensitive medication
  - Discontinue a sensitive medication, including through the discharge workflow
  - Set discharge quantity and repeats for a sensitive discharge medication
  - Print a sensitive prescription
- `create` for `SensitiveMedication`
  - Create a prescription for a sensitive medication
  - Add existing ongoing sensitive medications to an encounter
  - Create a new ongoing sensitive medication record through the patient-level ongoing medications table

## Medication administration record

Required to view the MAR, record administration and manage records:

- `list` for `MedicationAdministration`
  - View the MAR
  - View medication due tasks in the clinician dashboard 'Upcoming tasks' table
- `read` for `MedicationAdministration`
  - View details of an administration record
- `write` for `MedicationAdministration`
  - Record a medication error
  - Change the status of an administration record
  - Edit administration record details
  - Add an additional dose to an administration record
- `create` for `MedicationAdministration`
  - Record a medication administration, as either given or not given

## Pharmacy note

Required for the pharmacy note functionality:

- `write` for `MedicationPharmacyNote`
  - Edit an existing pharmacy note
- `create` for `MedicationPharmacyNote`
  - Record a new pharmacy note. Without this permission the field is read only

## Admin panel

### Reference data

All reference data types require `ReferenceData` permissions for import and export:

- For import, `write` and `create` for `ReferenceData`
- For export, `list` for `ReferenceData`

### Settings

Required to manage medication related settings:

- `read` for `Setting`
  - View settings
- `write` for `Setting`
  - Modify settings

---

# Sensitive medications (supported from v2.39 onwards)

> [!NOTE]
> Deployments running a version earlier than v2.39 cannot flag medications as sensitive. Confirm your
> deployment version before configuring this.

This feature flags a medication as sensitive, so that only users with the required permissions can view
and interact with it.

> [!WARNING]
> Use this feature rarely. Medication information is critical for safe care, and hiding it from staff
> without the permission carries clinical risk.

To configure a medication as sensitive:

1. Set the medication as sensitive in the `Drug` reference data. See [Drug](reference-data.md#drug)
2. Configure sensitive medication permissions for the required roles. See
   [Sensitive medications permissions](#sensitive-medications)

**Note:**

- Where a medication set includes a sensitive medication, only users with sensitive medication
  permissions can order that set
- Sensitive medications are excluded from the following printouts and integrations, even for users with
  sensitive medication permissions:
  - Patient discharge summary
  - Patient encounter record
  - Patient encounter progress record
  - International patient summary
  - Medici report
