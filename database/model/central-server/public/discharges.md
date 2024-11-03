{% docs table__discharges %}
Information about a discharge.

A discharge is the end of the lifecycle for an encounter.
{% enddocs %}

{% docs discharges__note %}
Free-form notes about the discharge.

May include treatment plan and follow-ups, written by the discharging clinician.

Since v2.0, also see the [`notes`](#!/source/source.tamanu.tamanu.notes) table for encounter and discharge notes.
{% enddocs %}

{% docs discharges__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) this discharge is for.
{% enddocs %}

{% docs discharges__discharger_id %}
The [discharging clinician](#!/source/source.tamanu.tamanu.users).
{% enddocs %}

{% docs discharges__disposition_id %}
The discharge disposition or classification of the discharge ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs discharges__facility_name %}
Name of the discharging facility.
{% enddocs %}

{% docs discharges__facility_address %}
Address of the discharging facility.
{% enddocs %}

{% docs discharges__facility_town %}
Town of the discharging facility.
{% enddocs %}
