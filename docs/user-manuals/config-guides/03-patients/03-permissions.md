The permissions required to find, register and manage patients in Tamanu, record their history and
deaths, print their identification, and use the patient portal and AI patient summary, and to merge and
import patients in the admin panel.

For the reference data these permissions act on see [Reference data](01-reference-data.md), and for the
module's settings see [Settings](02-settings.md).

---

# Permissions

See [Users permissions](../02-users/03-permissions.md) for how roles and permissions work. This guide
lists the permissions each patient task needs. What every permission grants, on each screen, is in the
[Patients permission reference](../02-users/03-permissions.md#patients).

## Finding and registering patients

| Task | Permissions |
| --- | --- |
| Search the patient lists, including **All patients**, and find a patient in any patient field | `list` for `Patient` |
| Open a patient's record and see their details, including custom patient fields | `read` for `Patient` |
| Register a patient with **Add new patient**, including registering a birth | `create` for `Patient` |
| Save changes on the patient's **Details** tab, including changing the display ID | `write` for `Patient` |
| Mark a patient for sync, so their full record is kept at this facility | `read` for `Patient`, and `create` for `SyncPatient` (supported from v2.66 onwards) |
| See a patient's reminder contacts | `read` for `Patient` |
| Add and remove reminder contacts | `write` for `Patient` |

Before v2.66, marking a patient for sync needs only `read` for `Patient`.

On mobile, registering patients and editing their details are switched on by settings rather than
permissions. See [Tamanu Mobile](02-settings.md#tamanu-mobile).

## Patient history

The patient history sections in the patient sidebar on desktop each have their own permission noun.
All of them also need `read` for `Patient`, and choosing a value from reference data needs `list` for
`ReferenceData`.

| Section | Permission noun |
| --- | --- |
| **Ongoing conditions** | `PatientCondition` |
| **Allergies** | `PatientAllergy` |
| **Family history** | `PatientFamilyHistory` |
| **Other patient issues** | `PatientIssue` |
| **Care plans** | `PatientCarePlan` |

| Task | Permissions |
| --- | --- |
| See the section | `list` for the section's noun |
| Add an item | `create` for the section's noun |
| Edit an item | `read` and `write` for the section's noun |
| Delete an ongoing condition | `delete` for `PatientCondition` |
| Open a care plan and see its notes | `read` for `PatientCarePlan` |
| Add a note to a care plan | `create` for `PatientCarePlan` |
| Edit or delete a care plan note | `write` for `PatientCarePlan` |

The add and edit buttons show to every user who can see the section, and the change is refused when it
is saved without the permission.

## Patient deaths

Recording deaths must also be turned on in settings. See [Patient deaths](02-settings.md#patient-deaths).

| Task | Permissions |
| --- | --- |
| Record a death with **Record death** | `create` for `PatientDeath`, and `write` for `Patient` |
| See a deceased patient's death details | `read` for `PatientDeath` |
| Revert a death record that is not final | `read` and `create` for `PatientDeath`, and `write` for `Patient` |

## Patient resources

**Patient resources** in the patient sidebar prints identification and certificates. See
[ID cards and labels](02-settings.md#id-cards-and-labels).

| Task | Permissions |
| --- | --- |
| Print an **ID card**, **Multiple ID labels**, **QR code ID** or **Birth notification** | `read` for `Patient`. These need no permission of their own |
| Email the patient their **International Patient Summary** QR code | `create` for `IPSRequest` |
| Register the patient for the patient portal with **Patient portal registration** | `create` for `PatientPortalRegistration` |

## Patient portal

The patient portal must also be turned on in settings. See
[Patient portal](02-settings.md#patient-portal-supported-from-v242-onwards).

| Task | Permissions |
| --- | --- |
| Register a patient for the portal | `create` for `PatientPortalRegistration` |
| Send a form to the portal with **Send to patient portal** | `create` for `PatientPortalForm`, and `create` for `PatientPortalRegistration` if the patient is not yet registered |
| See the outstanding portal forms on the patient's **Forms** tab | `list` for `PatientPortalForm` |
| Delete an outstanding portal form | `delete` for `PatientPortalForm` |

Choosing a form also needs the `Program` and `Survey` permissions for that form. See the
[Programs](../06-programs/) configuration guides.

## AI patient summary

The AI patient summary must also be turned on in settings. See
[AI patient summary](02-settings.md#ai-patient-summary-supported-from-v257-onwards).

| Task | Permissions |
| --- | --- |
| See the **AI patient summary** panel | `read` and `write` for `PatientSummary` |
| Generate the summary, including **Regenerate AI summary** | `create` for `PatientSummary` |
| Edit and save the summary, or discard it | `write` for `PatientSummary` |

## Admin panel

### Reference data

| Reference data | Permission noun |
| --- | --- |
| [Patient details](01-reference-data.md#patient-details), [Secondary Id Type](01-reference-data.md#secondary-id-type) and [Patient history](01-reference-data.md#patient-history) types | `ReferenceData` |
| [Address hierarchy](01-reference-data.md#address-hierarchy) links | `ReferenceDataRelation` |
| [Patient Field Def Category](01-reference-data.md#patient-field-def-category) | `PatientFieldDefinitionCategory` |
| [Patient Field Definition](01-reference-data.md#patient-field-definition) | `PatientFieldDefinition` |

| Task | Permissions |
| --- | --- |
| Import | `create` and `write` for the type's noun |
| Export | `list` for the type's noun |
| See records on the **Manage** tab | `list` for the type's noun |
| Add a record on the **Manage** tab | `create` for the type's noun |
| Edit a record on the **Manage** tab | `write` for the type's noun |

### Patient import

| Task | Permissions |
| --- | --- |
| Import patients on the **Patient data** screen | `create` and `write` for `Patient` |
| Export patients on the **Patient data** screen | `list` for `Patient` |

See [Patients](01-reference-data.md#patients).

### Settings

| Task | Permissions |
| --- | --- |
| View settings | `read` for `Setting` |
| Change settings | `write` for `Setting`. Settings marked high risk also need the `admin` role |

---

# Patient merge

Patient merge combines two records for the same person into one. It is done on the **Patient merge**
screen of the admin panel, and needs `read` and `write` for `Patient`.

**[Screenshot: the Patient merge screen with two patients selected]**

The two patients are found by entering each display ID exactly and selecting **Get**. After selecting
**Merge**, the user chooses which record to keep and selects **Next**, then **Confirm**.

> [!WARNING]
> A merge cannot be undone, and takes up to 24 hours to reach every facility and device.

When two patients are merged:

- The kept patient's details are kept. Any detail recorded only on the merged patient, including custom
  patient field values, is added to the kept patient
- All clinical records from both patients are kept on the kept patient, including encounters, ongoing
  conditions, allergies, family history, vaccinations and patient-level notes
- Program registrations from both patients are kept. Where both are registered in the same program
  registry, the kept patient's registration is kept, and form responses from both are kept
- Where both patients have a death record, the kept patient's is the one shown
- Where both have a patient portal account, one is kept: a registered account over one that is not, and
  otherwise the more recently updated
- The merged patient no longer appears in Tamanu, and their display ID is not kept as a secondary ID

A patient with more than two records is merged two at a time.
