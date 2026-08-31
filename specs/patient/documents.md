---
id: DOC
---

# Patient documents

Files clinicians attach to a patient or to one of their encounters, listed together on
the patient's Documents tab.

## Adding a document

- [ ] A document is added by choosing a file and giving it a name, optionally with a
      document owner, department, and note.
- [ ] The document is stored against the encounter it was added from, or against the
      patient when added outside an encounter.
- [ ] While a document is uploading, the form's Add button is unavailable and the form
      cannot be dismissed.
- [ ] A document that fails to upload reports why, and the patient's document list is
      left as it was.

## Repeat submissions

A clinician who double-clicks Add, or a client that retries a request it never saw
answered, submits the same document more than once. Each submission arrives separately,
so the duplicates are resolved when the document is recorded.

- [ ] Submitting the same document to the same patient or encounter more than once in
      quick succession records one document.
- [ ] This holds when the submissions are handled at the same time, so two simultaneous
      submissions cannot each record their own copy.
- [ ] Every submission of that document reports success and identifies the same single
      document, so a clinician sees one new row in the list.
- [ ] Two documents are the same submission when they belong to the same patient or
      encounter, carry the same name, and were created at the same time. Documents
      differing in any of these are recorded separately.
- [ ] Adding the same file again later is a deliberate act and records a second
      document.
