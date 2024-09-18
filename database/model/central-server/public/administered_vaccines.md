{% docs table__vaccine_administrations %}
Table of vaccines administered to patients related to the Vaccination modal
{% enddocs %}

{% docs vaccine_administrations__id %}
Tamanu identifier for vaccine administrations recorded
{% enddocs %}

{% docs vaccine_administrations__batch %}
Batch identifier of vaccine administrations recorded
{% enddocs %}

{% docs vaccine_administrations__status %}
Status of vaccine administrations recorded. 

The `RECORDED_IN_ERROR` status is assigned to vaccines initially recorded
as `GIVEN` that are then deleted.

The `HISTORICAL` status is assigned to vaccines initially recorded as 
`NOT_GIVEN` that are then recorded as `GIVEN`. This `HISTORICAL` status 
keeps a record that the vaccine was marked as `NOT_GIVEN` but hides this
record from the frontend to avoid confusion or conflict with the `GIVEN`
record.
{% enddocs %}

{% docs vaccine_administrations__reason %}
Reason for vaccine administrations `NOT_GIVEN` status. This is a free text field
{% enddocs %}

{% docs vaccine_administrations__injection_site %}
Injection site of the vaccine administrations recorded
{% enddocs %}

{% docs vaccine_administrations__consent %}
Consent of the vaccine administrations recorded
{% enddocs %}

{% docs vaccine_administrations__given_elsewhere %}
Checks if the vaccine was given elsewhere
{% enddocs %}

{% docs vaccine_administrations__vaccine_name %}
Vaccine name of the vaccine administration recorded
{% enddocs %}

{% docs vaccine_administrations__vaccine_brand %}
Vaccine brand of the vaccine administration recorded
{% enddocs %}

{% docs vaccine_administrations__disease %}
Disease the vaccine addresses of the vaccine administration recorded
{% enddocs %}

{% docs vaccine_administrations__consent_given_by %}
Free text field recording consent given by
{% enddocs %}
