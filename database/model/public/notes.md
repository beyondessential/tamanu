{% docs table__notes %}
Notes recorded by clinicians or system generated.

Also see the deprecated [`note_items`](#!/source/source.tamanu.tamanu.note_items),
[`note_pages`](#!/source/source.tamanu.tamanu.note_pages), and the even older
[`notes_legacy`](#!/source/source.tamanu.tamanu.notes_legacy).

This is the current version (3) of the notes system.
{% enddocs %}

{% docs notes__record_id %}
Polymorphic relationship to the record to which the note is attached (id).
{% enddocs %}

{% docs notes__record_type %}
Polymorphic relationship to the record to which the note is attached (type).
{% enddocs %}

{% docs notes__content %}
The content of the note recorded.
{% enddocs %}

{% docs notes__author_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who published this note.
{% enddocs %}

{% docs notes__on_behalf_of_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who wrote this note, if it wasn't the user who published it.
{% enddocs %}

{% docs notes__revised_by_id %}
Reference to the [note](#!/source/source.tamanu.tamanu.notes) that is being revised.
{% enddocs %}

{% docs notes__note_type_id %}
Reference to the note type ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = noteType`).
{% enddocs %}
