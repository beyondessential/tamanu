{% docs table__attachments %}
Uploaded files.

These can be documents, photo IDs, patient letters...

Most direct uploads will have a corresponding [`document_metadata`](#!/source/source.tamanu.tamanu.document_metadata),
but there's other ways to upload files, such as [for lab requests](#!/source/source.tamanu.tamanu.lab_request_attachments).

Uploaded files are not currently synced to facility servers. Instead, servers request the contents
of documents just-in-time. This does require facility servers to be "online" but significantly
reduces sync pressure.
{% enddocs %}

{% docs attachments__name %}
The name for the attachment set on upload.

Typically this is the filename.
{% enddocs %}

{% docs attachments__type %}
The [media type](https://en.wikipedia.org/wiki/Media_type) of the file.
{% enddocs %}

{% docs attachments__size %}
The file size in bytes.
{% enddocs %}

{% docs attachments__data %}
The file data, for attachments that predate content-addressed blob storage and
have not yet been moved onto the filesystem. Empty once the row carries a hash.
{% enddocs %}

{% docs attachments__hash %}
The algorithm-tagged hash of the file's contents, naming the blob that holds the
bytes in the [blob store](#!/source/source.tamanu.tamanu.blobs).
{% enddocs %}

{% docs attachments__patient_id %}
The patient the attachment was created for, copied from its owning record so the attachment synchronises within that record's scope.
{% enddocs %}

{% docs attachments__encounter_id %}
The encounter the attachment was created for, where its owning record is pinned to one. Attachments created directly against a patient leave this null.
{% enddocs %}
