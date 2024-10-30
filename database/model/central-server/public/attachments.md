{% docs table__attachments %}
Uploaded files.

These can be documents, photo IDs, patient letters...

Most direct uploads will have a corresponding [`document_metadata`](#!/source/source.tamanu.tamanu.document_metadata),
but there's other ways to upload files, such as [for lab requests](#!/source/source.tamanu.tamanu.lab_request_attachments).
{% enddocs %}

{% docs attachments__name %}
The name for the attachment set on upload.
{% enddocs %}

{% docs attachments__type %}
The [media type](https://en.wikipedia.org/wiki/Media_type) of the file.
{% enddocs %}

{% docs attachments__size %}
The file size in bytes.
{% enddocs %}

{% docs attachments__data %}
The file data.
{% enddocs %}
