## notes

Notes recorded by clinicians or system generated.

Also see the deprecated ``note_items``,
``note_pages``, and the even older
``notes_legacy``.

This is the current version (3) of the notes system.

## note_type

Type of note recorded.

## record_id

Polymorphic relationship to the record to which the note is attached (id).

## record_type

Polymorphic relationship to the record to which the note is attached (type).

## content

The content of the note recorded.

## author_id

Reference to the `user` who published this note.

## on_behalf_of_id

Reference to the `user` who wrote this note, if it wasn't the user who published it.

## revised_by_id

Reference to the `user` who revised this note.

