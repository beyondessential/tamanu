{% docs table__encounter_pause_prescriptions %}
Records details about the prescription being paused, the duration and timing of the pause, and the clinician responsible for initiating the pause.
{% enddocs %}

{% docs encounter_pause_prescriptions__encounter_prescription_id %}
References the unique identifier of the prescription being paused. This links to the `encounter_prescriptions` table to provide context about the specific prescription.
{% enddocs %}

{% docs encounter_pause_prescriptions__pause_duration %}
Describes the length of time for which the prescription is paused. This value works in conjunction with the `pause_time_unit` field to specify the duration (e.g., 5 days, 2 weeks).
{% enddocs %}

{% docs encounter_pause_prescriptions__pause_time_unit %}
Specifies the unit of time for the pause duration. Common values include days, weeks and it works in conjunction with the `pause_duration` field to define the total pause period.
{% enddocs %}

{% docs encounter_pause_prescriptions__pause_start_date %}
Indicates the date when the prescription pause begins. This field is used to track the start of the pause period.
{% enddocs %}

{% docs encounter_pause_prescriptions__pause_end_date %}
Indicates the date when the prescription pause ends. This field is used to track the end of the pause period.
{% enddocs %}

{% docs encounter_pause_prescriptions__notes %}
Provides additional information or context about the prescription pause.
{% enddocs %}

{% docs encounter_pause_prescriptions__pausing_clinician_id %}
References the unique identifier of the clinician responsible for initiating the pause.
{% enddocs %}

{% docs encounter_pause_prescriptions__created_by %}
References the unique identifier of the user who created the record.
{% enddocs %}
