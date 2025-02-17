{% docs table__encounters %}
Tracks the basic information of the patient encounters within Tamanu from start to finish
{% enddocs %}

{% docs encounters__id %}
Tamanu identifier for encounters recorded. This is linked to by many other tables with more in depth linked encounter information
{% enddocs %}

{% docs encounters__encounter_type %}
Text value for the type of encounter
{% enddocs %}

{% docs encounters__start_date %}
The beginning of the encounter
{% enddocs %}

{% docs encounters__end_date %}
The date encounter was discharged/ended
{% enddocs %}

{% docs encounters__reason_for_encounter %}
Text information about the encounter. Can include info like type of survey submitted, emergency diagnosis or a text field filled in on encounter creation
{% enddocs %}

{% docs encounters__device_id %}
Unique identifier for the device that created the encounter
{% enddocs %}

{% docs encounters__start_date_legacy %}
The old way of storing start dates in tamanu
{% enddocs %}

{% docs encounters__end_date_legacy %}
The old way of storing end dates in tamanu
{% enddocs %}

{% docs encounters__planned_location_id %}
The location that the encounter will transfer to at the planned_location_start_time
{% enddocs %}

{% docs encounters__patient_id %}
TODO
{% enddocs %}

{% docs encounters__examiner_id %}
TODO
{% enddocs %}

{% docs encounters__location_id %}
TODO
{% enddocs %}

{% docs encounters__department_id %}
TODO
{% enddocs %}

{% docs encounters__planned_location_start_time %}
The time that the encounter will transfer to the planned location
{% enddocs %}

{% docs encounters__patient_billing_type_id %}

{% enddocs %}

{% docs encounters__referral_source_id %}

{% enddocs %}
