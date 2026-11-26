---
id: IMGR
---

# Imaging results

Applies to recording a result on an imaging request, by hand or from an imaging integration: who completed it, when it was completed, its description, and which result an integration's study updates.

## Borrowed terms

- [Imaging study](https://hl7.org/fhir/R4B/imagingstudy.html): the FHIR `ImagingStudy` resource, by which an imaging system describes the images an examination produced.
- [Accession number](https://hl7.org/fhir/R4B/imagingstudy-definitions.html#ImagingStudy.identifier): the identifier an imaging system assigns to an examination it has been asked to perform, carried on the study as one of its identifiers.

## Recording a result by hand

- A result records who completed it (Completed by), when it was completed (Completed), and a result description.
- A result can be entered only while the request's status is Completed.
- Completed defaults to the current date and time.
- When the user changes the request's status to Completed, Completed by defaults to the logged-in user, unless a clinician is already chosen. The user can change it before saving.
- A request that is already Completed opens with Completed by empty, ready for an additional result.

> [!NOTE]
> Completed by is defaulted on the change of status rather than whenever the request is opened, because a chosen clinician is what makes a save record a result. Defaulting it on opening would add a result in the name of whoever next saves a completed request, even to change only its facility area.

## Results from an integration

- An imaging integration records a result on a request by sending an imaging study that carries an accession number, a link to the images, or both, along with any report text.
- A result a study adds holds the study's report as its description, its accession number and its link, and has no Completed by.
- For a result a study adds, Completed is the study's start time, or the time the study arrived when the study gives none.
- Recording a result from a study changes the request's status to Completed.
- A study with an accession number updates the result already recorded on the request under that accession number.
- A study without an accession number updates the most recently added result on the request that has a link, no accession number and no Completed by, which is what an earlier study without an accession number leaves.
- A study that updates a result replaces the result's description and link with the ones it carries.
- A study with no result to update adds a new result alongside those the request already has.
- A result entered by hand keeps its description and Completed by when a study arrives for its request.

> [!NOTE]
> A study without an accession number carries nothing that says which result it belongs to. A study that is sent again or amended should replace what it recorded before, not add a duplicate, so it updates the one kind of result that only such a study leaves. Updating a result entered by hand would replace a clinician's report with the integration's text while the result still names the clinician, and updating a result recorded under an accession number would replace the report of a study it cannot be matched to.
