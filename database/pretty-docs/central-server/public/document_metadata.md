## document_metadata

Information about an uploaded document or file, typically attached to an encounter or directly to a patient.

The actual file data is stored in ``attachments``.

## name

Free-form name of the document.

Often this is the filename.

## type

The `media type` of the file.

## document_created_at

When the document was created.

Historically (before v2.0) this was the "created at" timestamp of the file itself, as reported by
the OS. However that information is no longer available to Tamanu in most contexts, so this is now
usually set to the upload time.

## document_uploaded_at

When the document was uploaded.

## document_owner

Name of the person who owns the document.

Typically this is the uploader's name.

## patient_id

Reference to the `patient` the document was uploaded to.

## encounter_id

Reference to the `encounter` the document was uploaded to.

## attachment_id

The `file data`.

## department_id

Reference to the `department` the document was uploaded from.

## note

Free-form description of the document.

## document_created_at_legacy

[Deprecated] When the document was created.

## document_uploaded_at_legacy

[Deprecated] When the document was uploaded.

## source

Where the document came from.

One of:
- `patient_letter`
- `uploaded`

