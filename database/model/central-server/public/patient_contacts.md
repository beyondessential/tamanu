{% docs table__patient_contacts %}
Describes how a patient may be contacted, via email, SMS, or IM apps.

At present, this is used for:
- display in the application (all methods)
- emailing the patient (`method=Email`)
- sending Telegram reminders for appointments (`method=Telegram`)
{% enddocs %}

{% docs patient_contacts__name %}
Free-form name of the contact method.

This could be the name of the patient, or a relationship if the contact method is via another person
(e.g. `Spouse`, `Parent`, `Caregiver`), or a logical keyword if multiple contacts of the same method
are provided (e.g. `Main`, `Primary`, `Work`, `Home`), etc.
{% enddocs %}

{% docs patient_contacts__method %}
What application the contact uses:
- `Email`
- `Sms`
- `WhatsApp`
- `Telegram`
{% enddocs %}

{% docs patient_contacts__connection_details %}
JSON structure containing the details of the contact.

Its schema varies based on the `method`.
{% enddocs %}

{% docs patient_contacts__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs patient_contacts__relationship_id %}
If the contact method is via another person.
{% enddocs %}
