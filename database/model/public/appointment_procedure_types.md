{% docs table__appointment_procedure_types %}
Junction table linking appointments to procedure types, allowing multiple procedure types to be associated with a single appointment.
{% enddocs %}

{% docs appointment_procedure_types__appointment_id %}
Reference to the [appointment](#!/source/source.tamanu.tamanu.appointments) this procedure type is associated with.
{% enddocs %}

{% docs appointment_procedure_types__procedure_type_id %}
Reference to the procedure type ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = procedureType`) associated with this appointment.
{% enddocs %}
