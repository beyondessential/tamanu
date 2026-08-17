# Duplicate document upload

## Where the guard sits

The duplicate was fixed twice over. The frontend guard in `DocumentForm` stops repeat
clicks within one mounted form. It was not enough on its own: duplicates still reached
QA on a build carrying it, because repeat submissions arrive as separate HTTP requests.
The server-side guard in `createDocumentMetadata` is what actually holds, and both
document routes go through it.

The server check runs under a transaction-scoped advisory lock keyed on the document's
identity. This is load-bearing, not defensive dressing: without the lock, two
simultaneous submissions both read before either writes, both find no duplicate, and
both insert — the exact double-click case. A plain check-then-insert passes a sequential
test and fails a concurrent one.

## Interaction with backend file deduping

Backend file deduping is planned for the next release. That removes the one trade-off
left here: a repeat submission currently uploads its file to central before being
deduped, orphaning an attachment. File deduping collapses those stored blobs, so
splitting `uploadAttachment` into parse and send steps to dedupe earlier is not worth
doing.

The two are separate layers and neither replaces the other. File deduping collapses
identical *file content* into one stored attachment. The guard here collapses repeat
*submissions* into one document record. With file deduping alone, a double-click would
still produce two rows in the patient's Documents list, both pointing at one stored
file. Removing `createDocumentMetadata` on the grounds that file deduping covers it
would bring the reported bug straight back.

## Outstanding

- The encounter route's deduplication is covered only by inference from the shared
  helper; only the patient route has an automated test for it.
