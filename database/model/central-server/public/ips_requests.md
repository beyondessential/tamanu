{% docs table__ips_requests %}
Queue of requests to generate [International Patient Summaries](https://international-patient-summary.net/) (IPS).
{% enddocs %}

{% docs ips_requests__patient_id %}
The [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs ips_requests__created_by %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who created this request.
{% enddocs %}

{% docs ips_requests__status %}
Processing status.
{% enddocs %}

{% docs ips_requests__email %}
Email to send the generated IPS to.
{% enddocs %}

{% docs ips_requests__error %}
If processing fails, the error.
{% enddocs %}
