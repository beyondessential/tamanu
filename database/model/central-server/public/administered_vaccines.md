{% docs table__administered_vaccines %}
Table of vaccines administered to patients.

Vaccinations are recorded via the Vaccinations modal; they are selected
from a list of Scheduled Vaccines and linked to a Patient via an Encounter.
{% enddocs %}

{% docs administered_vaccines__id %}
Tamanu identifier for vaccine administrations recorded
{% enddocs %}

{% docs administered_vaccines__batch %}
Batch identifier of vaccine administrations recorded
{% enddocs %}

{% docs administered_vaccines__status %}
Status of vaccine administrations recorded. 

The `RECORDED_IN_ERROR` status is assigned to vaccines initially recorded
as `GIVEN` that are then deleted.

The `HISTORICAL` status is assigned to vaccines initially recorded as 
`NOT_GIVEN` that are then recorded as `GIVEN`. This `HISTORICAL` status 
keeps a record that the vaccine was marked as `NOT_GIVEN` but hides this
record from the frontend to avoid confusion or conflict with the `GIVEN`
record.
{% enddocs %}

{% docs administered_vaccines__reason %}
Reason for vaccine administrations `NOT_GIVEN` status. This is a free text field
{% enddocs %}

{% docs administered_vaccines__injection_site %}
Injection site of the vaccine administrations recorded
{% enddocs %}

{% docs administered_vaccines__consent %}
Consent of the vaccine administrations recorded
{% enddocs %}

{% docs administered_vaccines__given_elsewhere %}
Checks if the vaccine was given elsewhere
{% enddocs %}

{% docs administered_vaccines__vaccine_name %}
Vaccine name of the vaccine administration recorded
{% enddocs %}

{% docs administered_vaccines__scheduled_vaccine_id %}
Reference to the [Scheduled Vaccine](#!/source/source.tamanu.tamanu.scheduled_vaccines) that was
administered.
{% enddocs %}

{% docs administered_vaccines__encounter_id %}
Reference to the [Encounter](#!/source/source.tamanu.tamanu.encounters) this vaccine was given in.
{% enddocs %}

{% docs administered_vaccines__vaccine_brand %}
Vaccine brand of the vaccine administration recorded
{% enddocs %}

{% docs administered_vaccines__disease %}
Disease the vaccine addresses of the vaccine administration recorded
{% enddocs %}

{% docs administered_vaccines__recorder_id %}
Reference to the [User](#!/source/source.tamanu.tamanu.users) who recorded this vaccination.
This may differ from the User or person who administered the vaccine.
{% enddocs %}

{% docs administered_vaccines__location_id %}
Reference to the [Location](#!/source/source.tamanu.tamanu.locations) at which the vaccine was
given.
{% enddocs %}

{% docs administered_vaccines__department_id %}
Reference to the [Department](#!/source/source.tamanu.tamanu.departments) at which the vaccine was
given.
{% enddocs %}

{% docs administered_vaccines__given_by %}
Free text field for the name of the health practitioner who administered the
vaccine. This is defaulted to the `display_name` of the logged-in User, but can
be changed. It is not a requirement that the administerer is a Tamanu User.
{% enddocs %}

{% docs administered_vaccines__consent_given_by %}
Free text field recording who gave consent for the vaccination.
This is usually the patient themselves, but may differ for children or dependent
persons or other cases.
{% enddocs %}

{% docs administered_vaccines__not_given_reason_id %}
Reference to a [Reference Data](#!/source/source.tamanu.tamanu.reference_data)
(`type=vaccineNotGivenReason`).

These are presented as a dropdown for ease of recording and reporting, alongside the free-text field.
{% enddocs %}

{% docs administered_vaccines__circumstance_ids %}
Array of references to [Reference Data](#!/source/source.tamanu.tamanu.reference_data)
(`type=vaccineCircumstance`).
{% enddocs %}
