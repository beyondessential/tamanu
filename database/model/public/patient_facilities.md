{% docs table__patient_facilities %}
Tracks which patients are of interest to which facilities.

This is used to refine sync data: only patient data related to these patients is synced to a
facility (plus general data, and some exceptions apply like vaccine data under some conditions).

In Tamanu, this can be set manually on the facility server (via the "mark for sync" button), or
centrally (via some labs / vaccine programs, or via bulk-imports).

_("Joe Patient attends X Clinic" is clinical info; even though an entry in patient facilities
doesn't necessarily imply this, it often does.)_
{% enddocs %}

{% docs patient_facilities__facility_id %}
Reference to the [facility](#!/source/source.tamanu.tamanu.facilities).
{% enddocs %}

{% docs patient_facilities__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs patient_facilities__last_interacted_time %}
The last time that a patient_facilities upsert was triggered
This happens in cases like
- On patient program registration creation
- On encounter creation
{% enddocs %}

{% docs patient_facilities__created_at_sync_tick %}
The current sync tick at time of creation
{% enddocs %}
