# Test cases: link-only ImagingStudy and manual imaging results

All cases post a FHIR ImagingStudy with a contained Endpoint and no accession number identifier to central, against a request that already has results. Automated in `packages/central-server/__tests__/hl7fhir/materialised/ImagingStudy.test.js`. Verifies spec: IMGR.

## Manual results are left alone

- [x] A request has a result entered by hand with a Completed by. Post a link-only study. The manual result keeps its description and has no link, and a second result holds the study's notes and link with no Completed by.
- [x] A request has a result entered by hand without a Completed by. Post a link-only study. The manual result is unchanged and a second result is added.
- [x] A request has a result entered by hand with a Completed by, which an earlier study wrote a link onto. Post a link-only study. The result keeps its description, link and Completed by, and a second result is added.

## Integration results are still updated

- [x] A request has a manual result and a result from an earlier link-only study. Post a second link-only study with a different link and notes. The earlier link-only result takes the new link and notes, the manual result is unchanged, and no third result appears.
- [x] Another request holds a result from an earlier link-only study. Post a link-only study for a request with no results. The other request's result is unchanged, and the study's request gets one new result.
- [x] A request has two results from earlier link-only studies. Post a link-only study. The newer of the two takes the new link and notes, and the older is unchanged.
- [x] A request has a result recorded under an accession number, with a link. Post a link-only study. The accession result keeps its description, link and accession number, and a second result is added.
- [x] A request has a result recorded under an accession number. Post a study with the same accession number. That result's description is updated (existing test, unchanged behaviour).
- [x] A request has no results. Post a link-only study. One result is created with the link and notes (existing test, unchanged behaviour).

## Manual check on a deployment

- [ ] On a facility whose RIS/PACS sends links without accession numbers, enter a result by hand on a completed request, then have the integration post its study. Open the request in Tamanu: both results show, the manual one with the clinician's text and name, the integration one with the link.
