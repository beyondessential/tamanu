---
id: LRPT
---

# Lab results printout

The printable A4 PDF of lab results. It is printed for a single lab request, or for every
request on an encounter that is Published, Verified or at Interim results. For how results
are shown on screen, see `labs/results.md`.

## Printing a single request

- [ ] A Published or Verified lab request offers "Print results".
- [ ] A request that is Reception pending, Results pending, Interim results or To be verified offers "Print interim report" in its actions menu.
- [ ] Both actions appear only when the lab results printout setting is on and the user has permission to read lab test results.
- [ ] Both open a preview of the printout, which staff can print from.

## Printing an encounter's results

- [ ] The encounter's Labs tab has an overflow menu holding "Print results". The Labs tab's Print and New lab request actions are buttons beside the menu.
- [ ] "Print results" prints every lab request on the encounter that is Published, Verified or at Interim results.
- [ ] A request containing a sensitive test is left out of the encounter printout for every user. Its results are printed from the request itself.
- [ ] Choosing "Print results" opens the preview directly, holding every eligible request, and staff can print from it.
- [ ] When the encounter has no eligible requests, "Print results" is hidden, and so is the overflow menu when it holds nothing else.
- [ ] "Print results" appears only when the lab results printout setting is on and the user has permission to read lab test results.
- [ ] "Print results" is available on a discharged or otherwise read-only encounter.
- [ ] Requests appear in the order they were requested, oldest first.

## Printout layout

- [ ] The first page opens with the facility letterhead and the title "Lab results", followed by the patient's details and the encounter's details. These appear once, however many requests the printout holds.
- [ ] Each request has its own block: request details (request ID, requester and requested date and time), sample details (sample date and time, collector, site and specimen type), and publication details (published date and time, publisher and status).
- [ ] Below its details, each request's results table lists each test with its result and unit, and its reference range. A secondary result, where the test supports one, follows the result in brackets.
- [ ] Results are grouped under a heading for each panel, followed by the request's individual tests under "Individual tests".
- [ ] A request with a results interpretation shows it in a box below its results table.
- [ ] A test with no result yet is listed with its result blank.
- [ ] In an encounter printout, the request blocks follow one another separated by a divider, with pages breaking only where the content requires.
- [ ] Pages after the first carry a running header with the document name and the patient's name and ID. A single-request printout's header also names the request ID.
- [ ] Every page's footer shows the print date and time and the page number out of the total.

## Interim results

- [ ] When a printout carries the interim banner, it sits under the title and reads "This report contains interim results that have not yet been published".
- [ ] A single-request printout carries the banner when the request is Reception pending, Results pending, Interim results or To be verified.
- [ ] An encounter printout carries the banner when any of its requests is at Interim results.
- [ ] In an encounter printout, each request at Interim results also carries its own interim marker above its block, so staff can tell which results are not final.
