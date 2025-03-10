{% docs table__note_items %}
Version 2 of note management.

In this version, notes were split between note pages and actual note (item) content.

Deprecated.

See also [`note_pages`](#!/source/source.tamanu.tamanu.note_pages).
{% enddocs %}

{% docs note_items__note_page_id %}
The [note page](#!/source/source.tamanu.tamanu.note_pages) this item belongs to.
{% enddocs %}

{% docs note_items__revised_by_id %}
Reference to the [note_item](#!/source/source.tamanu.tamanu.note_items) that is revised.
{% enddocs %}

{% docs note_items__author_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who published this note item.
{% enddocs %}

{% docs note_items__on_behalf_of_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who wrote this note item, if different from `author_id`.
{% enddocs %}

{% docs note_items__content %}
Text content of the note.
{% enddocs %}
