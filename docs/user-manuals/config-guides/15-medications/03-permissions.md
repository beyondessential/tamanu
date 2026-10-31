The permissions required to prescribe, administer and manage medications in the Tamanu Medications
Module, and to view medications flagged as sensitive.

For the reference data these permissions act on see [Reference data](01-reference-data.md), and for the
module's settings see [Settings](02-settings.md).

---

# Permissions

See [Users permissions](../02-users/03-permissions.md) for how roles and permissions work in Tamanu.

## Prescriptions and ongoing medications

Required to prescribe a medication and manage the ongoing medications list:

| Permission | What it grants |
| --- | --- |
| `list` for `Medication` | <ul><li>View a list of medications at the encounter level</li><li>View the ongoing medications list and last encounter discharge medications</li><li>View prescription details from any of the above views</li></ul> |
| `read` for `Medication` | <ul><li>Print a prescription</li><li>View a prescription's pause history</li><li>Open a prescription from a notification link</li></ul> |
| `write` for `Medication` | <ul><li>Pause and resume a medication</li><li>Discontinue a medication, including through the discharge workflow</li><li>Set discharge quantity and repeats for a medication</li></ul> |
| `create` for `Medication` | <ul><li>Create a new prescription through an encounter</li><li>Add existing ongoing medications to an encounter</li><li>Create a new ongoing medication record through the patient-level ongoing medications table</li></ul> |

## Sensitive medications

Required to view, manage and prescribe medications flagged as sensitive. See
[Sensitive medications](#sensitive-medications-supported-from-v239-onwards):

| Permission | What it grants |
| --- | --- |
| `list` for `SensitiveMedication` | <ul><li>View a sensitive medication in a view that lists medications, being the encounter level medications table, the medication administration record, the print prescription modal, the discharge modal and the patient level medications table</li></ul> |
| `read` for `SensitiveMedication` | <ul><li>View prescription details for a sensitive medication</li><li>View and record administrations of a sensitive medication on the MAR</li><li>View, send to pharmacy and dispense sensitive medications. See the [Dispensing](../16-dispensing/) configuration guides</li></ul> |
| `write` for `SensitiveMedication` | <ul><li>Pause and resume a sensitive medication</li><li>Discontinue a sensitive medication, including through the discharge workflow</li><li>Set discharge quantity and repeats for a sensitive discharge medication</li><li>Print a sensitive prescription</li></ul> |
| `create` for `SensitiveMedication` | <ul><li>Find sensitive medications, and medication sets containing them, when prescribing on desktop and mobile, and create a prescription for them</li><li>Add existing ongoing sensitive medications to an encounter</li><li>Create a new ongoing sensitive medication record through the patient-level ongoing medications table</li></ul> |

## Medication administration record

Required to view the MAR, record administration and manage records:

| Permission | What it grants |
| --- | --- |
| `list` for `MedicationAdministration` | <ul><li>View the MAR. Also requires `list` for `Medication`</li></ul> |
| `read` for `MedicationAdministration` | <ul><li>View details of an administration record</li></ul> |
| `write` for `MedicationAdministration` | <ul><li>Record a medication error</li><li>Change the status of an administration record</li><li>Edit administration record details</li><li>Add an additional dose to an administration record</li></ul> |
| `create` for `MedicationAdministration` | <ul><li>Record a medication administration, as either given or not given</li></ul> |

## Medication due tasks

Required to see medication due tasks on the clinician dashboard:

| Permission | What it grants |
| --- | --- |
| `read` for `MedicationDueTask` | <ul><li>View medication due tasks in the clinician dashboard 'Upcoming tasks' table. Also requires `read` for `Tasking`</li></ul> |

## Pharmacy note

Required for the pharmacy note functionality. Both also require `write` for `Medication`:

| Permission | What it grants |
| --- | --- |
| `write` for `MedicationPharmacyNote` | <ul><li>Edit an existing pharmacy note</li></ul> |
| `create` for `MedicationPharmacyNote` | <ul><li>Record a new pharmacy note. Without this permission the field is read only</li><li>Select **Display pharmacy notes on MAR**</li></ul> |

## Admin panel

### Reference data

All reference data types require `ReferenceData` permissions for import and export:

| Permission | What it grants |
| --- | --- |
| `write` and `create` for `ReferenceData` | <ul><li>Import reference data</li></ul> |
| `list` for `ReferenceData` | <ul><li>Export reference data</li></ul> |

### Settings

Required to manage medication related settings:

| Permission | What it grants |
| --- | --- |
| `read` for `Setting` | <ul><li>View settings</li></ul> |
| `write` for `Setting` | <ul><li>Modify settings</li></ul> |

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

1. Set the medication as sensitive in the `Drug` reference data. See [Drug](01-reference-data.md#drug)
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
