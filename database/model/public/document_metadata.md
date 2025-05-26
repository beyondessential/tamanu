{% docs table__document_metadata %}
Information about an uploaded document or file, typically attached to an encounter or directly to a patient.

The actual file data is stored in [`attachments`](#!/source/source.tamanu.tamanu.attachments).
{% enddocs %}

{% docs document_metadata__name %}
Free-form name of the document.

Often this is the filename.
{% enddocs %}

{% docs document_metadata__type %}
The [media type](https://en.wikipedia.org/wiki/Media_type) of the file.
{% enddocs %}

{% docs document_metadata__document_created_at %}
When the document was created.

Historically (before v2.0) this was the "created at" timestamp of the file itself, as reported by
the OS. However that information is no longer available to Tamanu in most contexts, so this is now
usually set to the upload time.
{% enddocs %}

{% docs document_metadata__document_uploaded_at %}
When the document was uploaded.
{% enddocs %}

{% docs document_metadata__document_owner %}
Name of the person who owns the document.

Typically this is the uploader's name.
{% enddocs %}

{% docs document_metadata__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients) the document was uploaded to.
{% enddocs %}

{% docs document_metadata__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) the document was uploaded to.
{% enddocs %}

{% docs document_metadata__attachment_id %}
The [file data](#!/source/source.tamanu.tamanu.attachments).
{% enddocs %}

{% docs document_metadata__department_id %}
Reference to the [department](#!/source/source.tamanu.tamanu.departments) the document was uploaded from.
{% enddocs %}

{% docs document_metadata__note %}
Free-form description of the document.
{% enddocs %}

{% docs document_metadata__document_created_at_legacy %}
[Deprecated] When the document was created.
{% enddocs %}

{% docs document_metadata__document_uploaded_at_legacy %}
[Deprecated] When the document was uploaded.
{% enddocs %}

{% docs document_metadata__source %}
Where the document came from.

One of:
- `patient_letter`
- `uploaded`
{% enddocs %}
