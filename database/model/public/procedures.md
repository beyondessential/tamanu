{% docs table__procedures %}
Record of each procedure in progress or completed.
{% enddocs %}

{% docs procedures__completed %}
Whether the procedure has completed.
{% enddocs %}

{% docs procedures__end_time %}
When the procedure ended, if it's completed.
{% enddocs %}

{% docs procedures__note %}
Free-form description of the procedure.
{% enddocs %}

{% docs procedures__completed_note %}
Free-form notes at completion of the procedure.
{% enddocs %}

{% docs procedures__encounter_id %}
The [encounter](#!/source/source.tamanu.tamanu.encounters) this procedure is a part of.
{% enddocs %}

{% docs procedures__location_id %}
Reference to the [location](#!/source/source.tamanu.tamanu.locations) the procedure happens in.
{% enddocs %}

{% docs procedures__procedure_type_id %}
Reference to the procedure type ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = procedureType`).
{% enddocs %}

{% docs procedures__anaesthetic_id %}
Reference to the anaesthetic ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = drug`).
{% enddocs %}

{% docs procedures__physician_id %}
Reference to the [physician](#!/source/source.tamanu.tamanu.users).
{% enddocs %}

{% docs procedures__anaesthetist_id %}
Reference to the [anaesthetist](#!/source/source.tamanu.tamanu.users).
{% enddocs %}

{% docs procedures__start_time %}
When the procedure started.
{% enddocs %}

{% docs procedures__start_time_legacy %}
[Deprecated] When the procedure started.
{% enddocs %}

{% docs procedures__end_time_legacy %}
[Deprecated] When the procedure ended.
{% enddocs %}

{% docs procedures__department_id %}
Reference to the [department](#!/source/source.tamanu.tamanu.departments) where the procedure is performed.
{% enddocs %}

{% docs procedures__assistant_anaesthetist_id %}
Reference to the assistant [anaesthetist](#!/source/source.tamanu.tamanu.users).
{% enddocs %}

{% docs procedures__time_in %}
The time when the patient entered the procedure room or when the procedure setup began.
{% enddocs %}

{% docs procedures__time_out %}
The time when the patient left the procedure room or when the procedure cleanup was completed.
{% enddocs %}
