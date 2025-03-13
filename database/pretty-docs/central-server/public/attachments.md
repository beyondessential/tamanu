## attachments

Uploaded files.

These can be documents, photo IDs, patient letters...

Most direct uploads will have a corresponding ``document_metadata``,
but there's other ways to upload files, such as `for lab requests`.

Uploaded files are not currently synced to facility servers. Instead, servers request the contents
of documents just-in-time. This does require facility servers to be "online" but significantly
reduces sync pressure.

## name

The name for the attachment set on upload.

Typically this is the filename.

## type

The `media type` of the file.

## size

The file size in bytes.

## data

The file data.

