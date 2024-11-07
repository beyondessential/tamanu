{% docs table__notes_legacy %}
Version 1 of note management.

Deprecated.
{% enddocs %}

{% docs notes_legacy__record_id %}
Polymorphic relationship to the record to which the note is attached (id).
{% enddocs %}

{% docs notes_legacy__record_type %}
Polymorphic relationship to the record to which the note is attached (type).
{% enddocs %}

{% docs notes_legacy__note_type %}
Type of the note.
{% enddocs %}

{% docs notes_legacy__content %}
Text content of the note.
{% enddocs %}

{% docs notes_legacy__author_id %}
Reference to the [person who published the note](#!/source/source.tamanu.tamanu.users).
{% enddocs %}

{% docs notes_legacy__on_behalf_of_id %}
Reference to the [person who actually wrote the note](#!/source/source.tamanu.tamanu.users), if different from `author_id`.
{% enddocs %}
