{% docs fhir__table__medication_requests %}
FHIR data about medication requests, used for pharmacy orders integration.

<https://www.hl7.org/fhir/medicationrequest.html>
{% enddocs %}

{% docs fhir__medication_requests__identifier %}
Single identifier which maps to the id of the pharmacy_order_prescription which is the upstream of this medication request.
{% enddocs %}

{% docs fhir__medication_requests__status %}
Status of the request. Always `active` for now.
{% enddocs %}

{% docs fhir__medication_requests__intent %}
Intent of the request. Always `order` for now.
{% enddocs %}

{% docs fhir__medication_requests__group_identifier %}
Identifier that links multiple medication_requests that came from the same pharmacy_order. Maps to the pharmacy_order id.
{% enddocs %}

{% docs fhir__medication_requests__subject %}
FHIR reference to the Patient that this medication_request is for.
{% enddocs %}

{% docs fhir__medication_requests__encounter %}
FHIR reference to the Encounter that this medication_request was created in.
{% enddocs %}

{% docs fhir__medication_requests__medication %}
Drug that is being requested. Uses mSupply universal code mapping.
{% enddocs %}

{% docs fhir__medication_requests__authored_on %}
Date the request was ordered.
{% enddocs %}

{% docs fhir__medication_requests__requester %}
FHIR reference to the Organization that this medication_request is requested by.
{% enddocs %}

{% docs fhir__medication_requests__recorder %}
FHIR reference to the Practitioner that ordered this medication_request.
{% enddocs %}

{% docs fhir__medication_requests__note %}
Comments attached to the request.
{% enddocs %}

{% docs fhir__medication_requests__dosage_instruction %}
Information about the dosage and instructions for taking the medication.
{% enddocs %}

{% docs fhir__medication_requests__dispense_request %}
Information about the quantity of the medication to be dispensed and the number of repeats.
{% enddocs %}

{% docs fhir__medication_requests__category %}
The type of medication usage. Currently will only be present as 'discharge' if its a discharge prescription.
{% enddocs %}
