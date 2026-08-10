# Antivirus scanning for stored blobs — test cases

Scenarios that verify content is scanned without ever blocking ingest, that each
serve posture withholds what it should, and that a known-bad hash stays refused
everywhere it turns up.

Automated coverage lives in `packages/database/__tests__/blobStore/BlobScanner.test.ts`
and `servePolicy.test.ts`, and in the quarantine case in
`packages/mobile/App/services/blobs/MobileBlobStore.spec.ts`.

## Scanning

- [x] A newly admitted blob is scanned by a later pass, and the verdict is recorded
  with the scanner and signature versions behind it (verifies spec: AV)
- [x] An infected verdict is recorded and handed to the server to quarantine
- [x] A blob already scanned under the current signatures is not scanned again
- [x] A blob scanned clean under older signatures is scanned again once the scanner
  reports a newer signature version (verifies spec: AV)
- [x] An infected blob is not re-scanned when signatures move on
- [x] Corrupt and absent blobs are not scanned, having no servable bytes
- [x] A pass stops on its byte budget and reports itself rate limited
- [x] A blob whose bytes have gone since the pass queried does not end the pass
- [ ] Admission latency is unchanged with a scanner configured — needs a timing
  test against a real scanner, not a unit test
- [ ] A scan of a store of realistic size stays within its budget and does not
  starve the integrity scrub running on its own schedule

## Size cap

- [x] Content above the configured cap is left unscanned rather than sent
- [x] Over-cap content does not occupy the head of the queue and starve content the
  scanner can take (verifies spec: AV)
- [ ] Over-cap content under serve-only-when-known-good is withheld and reported as
  awaiting its scan, which is the operator-visible consequence of the cap

## Scanner outage

- [x] A scanner that cannot be reached at all skips the pass without recording
  anything (verifies spec: AV)
- [x] A scanner that goes away mid-pass ends the pass, leaving the rest unscanned
- [ ] Uploads continue to succeed while the scanner is unreachable
- [ ] Serving is unchanged under serve-unless-known-bad while the scanner is down

## Serve postures

- [x] Off serves unscanned, clean, infected and quarantined content alike, so a
  deployment can record verdicts before acting on them (verifies spec: AV)
- [x] Serve-unless-known-bad serves unscanned content and withholds infected
- [x] Serve-only-when-known-good serves only content scanned clean, and reports
  not-yet-scanned content as awaiting its scan (verifies spec: AV)
- [x] Withheld-infected is reported distinctly from awaiting-scan, so a reader is
  told the content is not coming rather than left waiting
- [x] A server that drives no scanner serves unless known-bad even under
  serve-only-when-known-good, rather than withholding everything it holds
- [x] The central attachment route answers each posture with the right status and
  availability state
- [x] The facility attachment route answers on its own quarantine records before
  asking central, so the answer is the same with the link down

## Quarantine and propagation

- [x] A device refuses to serve a quarantined hash even though its bytes verify
  (verifies spec: AV)
- [ ] A quarantine written on central reaches a facility and a device by ordinary
  synchronisation
- [x] A facility refuses a quarantined hash while it cannot reach central
- [x] Central answers an offer of a quarantined hash without wanting the bytes
- [x] Pushed bytes for a quarantined hash are not staged and do not clear it
- [ ] A quarantined hash is not fetched by a facility or a device
- [ ] Self-heal leaves a quarantined blob unrepaired on both central and a facility
  (verifies spec: SCRUB, AV)
- [ ] A verdict that lands after the content has been served stops it serving, and
  the referencing records stand
