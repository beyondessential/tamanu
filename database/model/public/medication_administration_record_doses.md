{% docs table__medication_administration_record_doses %}
Stores details about individual doses given as part of a medication administration record. A single administration event may involve multiple distinct doses (e.g., taking two tablets).
{% enddocs %}

{% docs medication_administration_record_doses__dose_amount %}
The amount or quantity of the medication administered in this specific dose entry.
{% enddocs %}

{% docs medication_administration_record_doses__given_time %}
The precise date and time when this specific dose was administered to the patient. This may differ slightly from the overall `administered_at` time in the parent record if multiple doses were given sequentially.
{% enddocs %}

{% docs medication_administration_record_doses__given_by_user_id %}
Reference to the [user](#!/model/model.public.users) who physically administered this dose to the patient.
{% enddocs %}

{% docs medication_administration_record_doses__recorded_by_user_id %}
Reference to the [user](#!/model/model.public.users) who recorded this dose administration in the system. This may or may not be the same user who administered the dose.
{% enddocs %}

{% docs medication_administration_record_doses__medication_administration_record_id %}
Reference to the MAR [medication administration record](#!/model/model.public.medication_administration_records) to which this dose belongs.
{% enddocs %}
