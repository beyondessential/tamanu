{% docs table__patient_communications %}
Messages being sent to a patient, via a variety of channels.

This is a multiplexed queue to send emails, SMS, IM messages, etc specifically to patients.

Processed by the `PatientEmailCommunicationProcessor` scheduled task.
{% enddocs %}

{% docs patient_communications__type %}
The type of communication.

This affects the template or action being taken.
{% enddocs %}

{% docs patient_communications__channel %}
The channel to send the message with.

One of:
- Email
- Sms
- WhatsApp
- Telegram
{% enddocs %}

{% docs patient_communications__subject %}
Subject line (short summary of the message).

This is the subject line of an email, or equivalent for other channels.
{% enddocs %}

{% docs patient_communications__content %}
Content of the message.
{% enddocs %}

{% docs patient_communications__status %}
Processing status of the communication.

One of:
- `Queued`
- `Processed`
- `Sent`
- `Error`
- `Delivered`
- `Bad Format`
{% enddocs %}

{% docs patient_communications__error %}
If the communication sending fails, this is the error.
{% enddocs %}

{% docs patient_communications__retry_count %}
How many times the sending has been retried.
{% enddocs %}

{% docs patient_communications__patient_id %}
The [patient](#!/source/source.tamanu.tamanu.patients) that communication is for.
{% enddocs %}

{% docs patient_communications__destination %}
Destination address to send this message to.

If this is not provided here, it will be derived from the patient, such as using the
[`patient_contacts`](#!/source/source.tamanu.tamanu.patient_contacts) table.
{% enddocs %}

{% docs patient_communications__attachment %}
The attachment as a string.
{% enddocs %}

{% docs patient_communications__hash %}
Hash of original data that went into creating the row, for purposes of deduplication.

The hashing is done with the `hashtext` postgres function.
{% enddocs %}
