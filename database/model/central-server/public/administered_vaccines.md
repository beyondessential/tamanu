{% docs table__administered_vaccines %}
Table of vaccines administered to patients related to the Vaccination modal
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
TODO
{% enddocs %}

{% docs administered_vaccines__encounter_id %}
TODO
{% enddocs %}

{% docs administered_vaccines__vaccine_brand %}
Vaccine brand of the vaccine administration recorded
{% enddocs %}

{% docs administered_vaccines__disease %}
Disease the vaccine addresses of the vaccine administration recorded
{% enddocs %}

{% docs administered_vaccines__recorder_id %}
TODO
{% enddocs %}

{% docs administered_vaccines__location_id %}
TODO
{% enddocs %}

{% docs administered_vaccines__department_id %}
TODO
{% enddocs %}

{% docs administered_vaccines__given_by %}
TODO
{% enddocs %}

{% docs administered_vaccines__consent_given_by %}
Free text field recording consent given by
{% enddocs %}

{% docs administered_vaccines__not_given_reason_id %}
TODO
{% enddocs %}

{% docs administered_vaccines__circumstance_ids %}
TODO
{% enddocs %}
