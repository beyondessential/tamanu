{% docs table__encounter_history %}
Records changes to an encounter's basic details.
{% enddocs %}

{% docs encounter_history__encounter_id %}
Reference to the original [encounter](#!/source/source.tamanu.tamanu.encounters) this history is for.
{% enddocs %}

{% docs encounter_history__department_id %}
Reference to the [department](#!/source/source.tamanu.tamanu.departments) the encounter was in.
{% enddocs %}

{% docs encounter_history__location_id %}
Reference to the [location](#!/source/source.tamanu.tamanu.locations) the encounter was in.
{% enddocs %}

{% docs encounter_history__examiner_id %}
Reference to the [examiner](#!/source/source.tamanu.tamanu.users) for the encounter.
{% enddocs %}

{% docs encounter_history__encounter_type %}
The type of the encounter.

One of:
- `admission`
- `clinic`
- `imaging`
- `emergency`
- `observation`
- `triage`
- `surveyResponse`
- `vaccination`
{% enddocs %}

{% docs encounter_history__actor_id %}
[Who](#!/source/source.tamanu.tamanu.users) made the change.
{% enddocs %}

{% docs encounter_history__change_type %}
The field which was changed.

One of:
- `encounter_type`
- `location`
- `department`
- `examiner`
{% enddocs %}