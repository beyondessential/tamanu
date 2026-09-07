# Runbook: blob antivirus (infected content, or scanning stalled)

A deployment that has turned on antivirus scanning reports that content has been
quarantined as malware, that files have stopped opening since the posture was
tightened, or that the scanner is not being reached. This surfaces as the
`blob_antivirus` healthcheck, as a clinician reporting a file that will not open,
or as quarantine rows found while triaging something else.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating.

## 1. Establish which of the three it is

The three reports look alike from a support ticket and are resolved completely
differently.

| What you see | What it is | Where to go |
| --- | --- | --- |
| A hash in `blob_quarantines` | Content found to be malware | §3 |
| Files not opening, nothing quarantined | The posture is ahead of the scanning | §4 |
| No verdicts recorded for hours | The scanner is not being reached | §5 |

**[diagnose]** The "Blob antivirus" queries in `../reference/query-cookbook.md`
answer all three: the quarantine list, scan coverage, and when the last verdict
was recorded.

## 2. Establish context

Which deployment and server, per `../deployment-context.md`. Then, on the
affected server, the two settings that decide behaviour:

- `blobStorage.antivirus.scanner` — which scanner this server drives, or `none`.
  A facility with `none` is normal: it serves on central's verdicts.
- `blobStorage.antivirus.servePolicy` — deployment-wide. `off` records verdicts
  without acting on them, `unless-known-bad` withholds only infected content,
  `only-known-good` withholds anything not yet scanned clean.

Both are readable in the admin panel's settings editor. **[diagnose]**

## 3. Resolve: content quarantined as malware

A quarantine is deliberate and propagates: the content is retained, never
served, never fetched, and never repaired, on every server and device in the
deployment. It is meant to stand.

**[diagnose]** Establish whether the content is referenced by a live clinical
record, and what the scanner called it. `scanner_version` and
`signature_version` on the quarantine row are what a false-positive review needs.

Then a human decision, not a technical one:

- **A true positive.** Nothing to do on the server. Tell the deployment contact
  which record references the content so the clinical workflow can be repeated
  with clean content. The quarantined bytes stay for investigation.
- **A suspected false positive.** Escalate with the hash, the scanner and
  signature versions, and the referencing record. Whether to lift a quarantine
  is a deployment decision with a security dimension, so it is **[dev-OTS]** at
  minimum and never something to clear because a clinician is waiting.

Do **not** delete the quarantine row to "unblock" a file. That is what makes the
content servable again everywhere at once, including on devices that have
already cached it.

## 4. Resolve: files not opening, nothing quarantined

Almost always `only-known-good` on a deployment whose scanning has not caught
up. Under that posture content is withheld until it has been scanned clean, so
every newly uploaded file is briefly unavailable, and a backlog makes "briefly"
long.

**[diagnose]** Run the scan-coverage query. A large unscanned count that is
falling is a backlog working itself off; one that is not falling is §5.

The scan runs on its own schedule and bounds
(`schedules.blobAntivirusScan`), separate from the integrity scrub. Raising
`maxBlobsPerPass` and `maxGigabytesPerPass`, or shortening the schedule, is an
**[approved-mitigation]** where the scanner has the headroom for it.

Where clinical work is blocked and the backlog is hours away, moving the posture
back to `unless-known-bad` restores serving of unscanned content immediately and
still withholds anything known bad. That is a deliberate loosening of a security
posture, so it is **[dev-OTS]** and agreed with the deployment, not a support
decision.

Content above `maxScanMB` is never scanned at all, so under `only-known-good` it
never serves. If the files that will not open are all large, that is the cause,
and the fix is the size cap and the scanner's own stream limit together, not the
schedule.

## 5. Resolve: the scanner is not being reached

An unreachable scanner is designed to be survivable: uploads keep working, the
scrub keeps running, and content simply stays unscanned. Nothing is lost. Under
`only-known-good`, though, unscanned means unserved, so a scanner outage there
does reach clinicians.

**[diagnose]** The server log carries `BlobScanner: scanner unavailable` with
the reason and the address it tried. Check the scanner service itself on the
host, and that the address in `blobStorage.antivirus.address` matches where it
listens (an absolute path is a unix socket, `host:port` is TCP).

Restarting the scanner service is a host action outside Tamanu, and follows the
deployment's own change process. Restarting Tamanu is not a fix: the scan pass
retries on its own schedule and picks up where it left off.

## 6. Escalate

Escalate immediately when:

- Quarantined content is referenced by a clinical record, or
- A false positive is suspected, or
- The scanner has been unreachable long enough that a `only-known-good`
  deployment is withholding content clinicians need.

Include the server, the hashes, the scanner and signature versions, the serve
policy, and the unscanned count over time. Use the structured payload from
`senaite-integration-delay.md` §6.

## 7. Do not

- Do **not** delete quarantine rows, on any server. They synchronise from
  central, so a facility-side delete is both ineffective and misleading.
- Do **not** delete quarantined blobs or their store files. The bytes are the
  evidence a false-positive review needs.
- Do **not** turn the serve policy off to clear a single stuck file. It is
  deployment-wide, and it stops every known-bad verdict being acted on.
