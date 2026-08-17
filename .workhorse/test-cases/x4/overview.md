# Test cases: duplicate document upload

Covers the double-click duplicate reported against 2.62.0, and the server-side guard
added after it recurred in QA on a build that already carried the frontend fix.

## Server-side deduplication

- [x] Two identical uploads submitted simultaneously to the same patient record one
      document (verifies spec: DOC)
- [x] Two identical uploads submitted one after the other record one document
      (verifies spec: DOC)
- [x] Both submissions return success and report the same document id (verifies spec: DOC)
- [x] Uploads differing by name record separate documents (verifies spec: DOC)
- [x] Identical uploads to different patients record separate documents (verifies spec: DOC)
- [x] An upload without a document creation time still records, and dedupes against
      other uploads equally lacking one
- [ ] Two identical uploads to the same *encounter* dedupe (the encounter route shares
      the helper, but only the patient route is covered by an automated test)
- [ ] The same file added again well after the first upload records a second document

## Frontend submit guard

- [x] Double-clicking Add uploads once
- [x] Add stays disabled while the upload is in flight
- [x] A single successful upload completes and closes the form

## Manual verification

- [ ] Double-click Add on a real deployment and confirm one row appears in Documents
- [ ] Confirm a genuinely repeated upload (same file, added again deliberately later)
      still creates a second document
- [ ] Confirm a failed upload still reports its error and leaves the list unchanged
