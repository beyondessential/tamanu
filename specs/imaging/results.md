---
id: IMGR
---

# Imaging results

Applies to recording a result on an imaging request, by hand or from an imaging integration: who completed it, when it was completed, and its description.

## Recording a result

- A result records who completed it (Completed by), when it was completed (Completed), and a result description.
- A result can be entered only while the request's status is Completed.
- Completed defaults to the current date and time.
- When the user changes the request's status to Completed, Completed by defaults to the logged-in user, unless a clinician is already chosen. The user can change it before saving.
- A request that is already Completed opens with Completed by empty, ready for an additional result.

> [!NOTE]
> Completed by is defaulted on the change of status rather than whenever the request is opened, because a chosen clinician is what makes a save record a result. Defaulting it on opening would add a result in the name of whoever next saves a completed request, even to change only its facility area.

## Results from an integration

- An imaging integration records a result on a request by sending an imaging study that carries an accession number, a link to the images, or both, along with any report text.
- A result recorded from a study holds the study's report as its description, its accession number and its link, and has no Completed by.
- A study with an accession number updates the result already recorded on the request under that accession number.
- A study without an accession number updates the most recent result that an earlier study without one recorded on the request.
- A result counts as recorded by a study without an accession number when it has a link, no accession number and no Completed by.
- A study with no such result to update adds a new result alongside those the request already has.
- A result entered by hand keeps its description and Completed by when a study arrives for its request.

> [!NOTE]
> A study without an accession number carries nothing that identifies which result it belongs to, so the only result it can safely claim is one that an earlier study of the same kind recorded. Updating a result entered by hand would replace a clinician's report with the integration's text while the result still names the clinician. Updating a result recorded under an accession number would replace that study's report when nothing shows the two are the same study.
