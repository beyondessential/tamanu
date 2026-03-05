{% docs table__certificate_notifications %}
Various medical certificates being sent to patients.

These rows are processed by the `CertificateNotificationProcessor` scheduled task, and generate a
[`patient_communications`](#!/source/source.tamanu.tamanu.patient_communications) row.

The actual certificate itself is stored separately on the filesystem while it's generated.
{% enddocs %}

{% docs certificate_notifications__type %}
Type of certificate being generated.

This dictates both from which resource the certificate is generated, and also the template being
used for generating the certificate itself.

One of:
- `covid_19_clearance`
- `vaccination_certificate`
- `icao.test`
- `icao.vacc`
{% enddocs %}

{% docs certificate_notifications__patient_id %}
Reference to a [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs certificate_notifications__forward_address %}
An email address to send the generated certificate to.
{% enddocs %}

{% docs certificate_notifications__lab_test_id %}
The [lab test](#!/source/source.tamanu.tamanu.lab_tests) this certificate is for, if applicable.
{% enddocs %}

{% docs certificate_notifications__status %}
Processing status.

One of:
- `Queued`
- `Processed`
- `Error`
- `Ignore`
{% enddocs %}

{% docs certificate_notifications__error %}
If the certificate generation fails, this is the error.
{% enddocs %}

{% docs certificate_notifications__created_by %}
The name of the user who initiated the creation of this certificate.
{% enddocs %}

{% docs certificate_notifications__lab_request_id %}
The [lab request](#!/source/source.tamanu.tamanu.lab_requests) this certificate is for, if applicable.
{% enddocs %}

{% docs certificate_notifications__printed_date %}
When this certificate was printed, if applicable.
{% enddocs %}

{% docs certificate_notifications__facility_name %}
The name of the facility where the creation of this certificate was initiated.
{% enddocs %}

{% docs certificate_notifications__language %}
Used to translate the certificate.
{% enddocs %}
