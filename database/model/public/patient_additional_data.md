{% docs table__patient_additional_data %}
Core or adjunct patient data that doesn't fit elsewhere, but is only downloaded to a facility once a
patient is marked for sync.

This is often referred to as "PAD".

See also `patient_field_definition_categories`, `patient_field_definitions`, and `patient_field_values`,
which define and specify custom/non-standard data to be stored against patients.
{% enddocs %}

{% docs patient_additional_data__place_of_birth %}
Free-form place of birth (typically a place name or country).
{% enddocs %}

{% docs patient_additional_data__primary_contact_number %}
Primary contact number.

Note that this may be complementary to the more structured data in `patient_contacts`.
{% enddocs %}

{% docs patient_additional_data__secondary_contact_number %}
Secondary contact number.

Note that this may be complementary to the more structured data in `patient_contacts`.
{% enddocs %}

{% docs patient_additional_data__marital_status %}
Marital status.

One of:
- `Defacto`
- `Married`
- `Single`
- `Widow`
- `Divorced`
- `Separated`
- `Unknown`
{% enddocs %}

{% docs patient_additional_data__city_town %}
Patient current address city or town.

This may be free-form or chosen from a drop-down, depending on how Tamanu is configured.
{% enddocs %}

{% docs patient_additional_data__street_village %}
Patient current address street or village.

This may be free-form or chosen from a drop-down, depending on how Tamanu is configured.
{% enddocs %}

{% docs patient_additional_data__educational_level %}
Highest educational attainment.
{% enddocs %}

{% docs patient_additional_data__social_media %}
Free-form social media contact.

Note that this may be complementary to the more structured data in `patient_contacts`.
{% enddocs %}

{% docs patient_additional_data__blood_type %}
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
{% enddocs %}

{% docs patient_additional_data__title %}
Patient name: title.
{% enddocs %}

{% docs patient_additional_data__ethnicity_id %}
Reference to patient ethnicity ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__nationality_id %}
Reference to patient nationality ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__country_id %}
Reference to patient country of residence ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__division_id %}
Reference to patient administrative division of residence ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__subdivision_id %}
Reference to patient administrative subdivision of residence ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__medical_area_id %}
Reference to patient administrative medical area of residence ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__nursing_zone_id %}
Reference to patient administrative nursing zone of residence ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__settlement_id %}
Reference to patient residence settlement ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__occupation_id %}
Reference to patient occupation ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).

There is at most one `patient_additional_data` row per patient.

Note that the `id` column is generated from this column to enforce this.
{% enddocs %}

{% docs patient_additional_data__birth_certificate %}
Birth certificate identifier.
{% enddocs %}

{% docs patient_additional_data__driving_license %}
Driving licence identifier.
{% enddocs %}

{% docs patient_additional_data__passport %}
Passport number.
{% enddocs %}

{% docs patient_additional_data__religion_id %}
Reference to patient religion ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__patient_billing_type_id %}
Reference to patient billing type.
{% enddocs %}

{% docs patient_additional_data__country_of_birth_id %}
Reference to patient country of birth ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__registered_by_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who registered the patient in Tamanu.
{% enddocs %}

{% docs patient_additional_data__emergency_contact_name %}
Name of emergency contact.
{% enddocs %}

{% docs patient_additional_data__emergency_contact_number %}
Phone number of emergency contact.
{% enddocs %}

{% docs patient_additional_data__mother_id %}
Reference to [patient](#!/source/source.tamanu.tamanu.patients) ID of mother / parent.
{% enddocs %}

{% docs patient_additional_data__father_id %}
Reference to [patient](#!/source/source.tamanu.tamanu.patients) ID of father / parent.
{% enddocs %}

{% docs patient_additional_data__updated_at_by_field %}
JSON object recording the updated datetime for individual columns.

As PADs contain a lot of disparate data, it's not uncommon that fields are edited separately in
different facilities. The default sync strategy is for the last edit to a whole row to "win out" in
case of a conflict, but this can lead to discarding important data in the case of PADs. This field
is used to implement per-field "last edit wins" instead.
{% enddocs %}

{% docs patient_additional_data__health_center_id %}
Reference to patient primary health center ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__insurer_id %}
Reference to patient insurer ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_additional_data__insurer_policy_number %}
Policy number of patient insurance.
{% enddocs %}

{% docs patient_additional_data__secondary_village_id %}
Reference to patient administrative village of residence ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), secondary).

See also [`patients.village_id`](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}
