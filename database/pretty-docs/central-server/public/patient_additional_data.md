## patient_additional_data

Core or adjunct patient data that doesn't fit elsewhere, but is only downloaded to a facility once a
patient is marked for sync.

This is often referred to as "PAD".

See also `patient_field_definition_categories`, `patient_field_definitions`, and `patient_field_values`,
which define and specify custom/non-standard data to be stored against patients.

## place_of_birth

Free-form place of birth (typically a place name or country).

## primary_contact_number

Primary contact number.

Note that this may be complementary to the more structured data in `patient_contacts`.

## secondary_contact_number

Secondary contact number.

Note that this may be complementary to the more structured data in `patient_contacts`.

## marital_status

Marital status.

One of:
- `Defacto`
- `Married`
- `Single`
- `Widow`
- `Divorced`
- `Separated`
- `Unknown`

## city_town

Patient current address city or town.

This may be free-form or chosen from a drop-down, depending on how Tamanu is configured.

## street_village

Patient current address street or village.

This may be free-form or chosen from a drop-down, depending on how Tamanu is configured.

## educational_level

Highest educational attainment.

## social_media

Free-form social media contact.

Note that this may be complementary to the more structured data in `patient_contacts`.

## blood_type

Blood type.

One of:
- `A+`
- `A-`
- `AB-`
- `AB+`
- `B+`
- `B-`
- `O+`
- `O-`

## title

Patient name: title.

## ethnicity_id

Reference to patient ethnicity (`Reference Data`).

## nationality_id

Reference to patient nationality (`Reference Data`).

## country_id

Reference to patient country of residence (`Reference Data`).

## division_id

Reference to patient administrative division of residence (`Reference Data`).

## subdivision_id

Reference to patient administrative subdivision of residence (`Reference Data`).

## medical_area_id

Reference to patient administrative medical area of residence (`Reference Data`).

## nursing_zone_id

Reference to patient administrative nursing zone of residence (`Reference Data`).

## settlement_id

Reference to patient residence settlement (`Reference Data`).

## occupation_id

Reference to patient occupation (`Reference Data`).

## patient_id

Reference to the `patient`.

There is at most one `patient_additional_data` row per patient.

Note that the `id` column is generated from this column to enforce this.

## birth_certificate

Birth certificate identifier.

## driving_license

Driving licence identifier.

## passport

Passport number.

## religion_id

Reference to patient religion (`Reference Data`).

## patient_billing_type_id

Reference to patient billing type.

## country_of_birth_id

Reference to patient country of birth (`Reference Data`).

## registered_by_id

Reference to the `user` who registered the patient in Tamanu.

## emergency_contact_name

Name of emergency contact.

## emergency_contact_number

Phone number of emergency contact.

## mother_id

Reference to `patient` ID of mother / parent.

## father_id

Reference to `patient` ID of father / parent.

## updated_at_by_field

JSON object recording the updated datetime for individual columns.

As PADs contain a lot of disparate data, it's not uncommon that fields are edited separately in
different facilities. The default sync strategy is for the last edit to a whole row to "win out" in
case of a conflict, but this can lead to discarding important data in the case of PADs. This field
is used to implement per-field "last edit wins" instead.

## health_center_id

Reference to patient primary health center (`Reference Data`).

## insurer_id

Reference to patient insurer (`Reference Data`).

## insurer_policy_number

Policy number of patient insurance.

## secondary_village_id

Reference to patient administrative village of residence (`Reference Data`, secondary).

See also ``patients.village_id``.

