---
id: AV
---

# Blob antivirus scanning

Stored blobs can be scanned for malware by the host's antivirus scanner. Tamanu
drives an external scanner rather than implementing one, and records each blob's
verdict by hash so identical content is scanned once. Scanning is off unless a
scanner is configured, and this feature is not required to store blobs — the store
is designed to accommodate it.

## Scanning

- [ ] Scanning invokes an external host scanner (such as clamd, Windows Defender, or
  an ICAP service); Tamanu does not implement malware detection itself.
- [ ] A blob's verdict is recorded by hash in the server's registry, along with when
  it was scanned and the scanner and signature versions that produced it, so identical
  content is scanned once regardless of how many records reference it.
- [ ] A verdict is independent of a blob's integrity state (see `integrity.md`).
  Infected content matches its hash, so a verdict says nothing about integrity and
  integrity says nothing about a verdict, and neither can be read off the other.
- [ ] Admission does not wait on the scanner. Content is admitted unscanned and its
  verdict is recorded by a scan that runs afterwards, so enabling scanning does not
  change how long an upload takes, and a deployment with no scanner configured runs
  the ingest path unchanged.
- [ ] A scanner that cannot be reached leaves content unscanned rather than refusing
  it, so an outage cannot stop clinicians uploading. What an unscanned blob does is
  the serve policy's decision, so an outage cannot widen what is served either.
- [ ] Blobs are re-scanned when the scanner's signatures are updated.
- [ ] The central server scans every blob it holds and its verdict is authoritative;
  a facility without its own scanner uses the central verdict.

## Serve policy

- [ ] The serve policy is an administrator setting with three postures: off, serve
  unless known-bad, and serve only when known-good. When no scanner is configured,
  behaviour is as if off.
- [ ] With the policy off, blobs are served subject only to access control.
- [ ] Serve-unless-known-bad, the default once scanning is enabled, serves any blob
  that does not have an infected verdict, including not-yet-scanned content.
- [ ] Serve-only-when-known-good serves a blob only once it has a clean verdict;
  not-yet-scanned content is withheld until scanned.
- [ ] Content withheld for want of a verdict is answered as awaiting its check, in
  the same shape as a content-pending reference (see `transfer.md`), so a client can
  tell content that is coming from content that is gone.

## Quarantine

- [ ] A blob with an infected verdict is quarantined: retained rather than deleted,
  never served, and recorded against its hash.
- [ ] Quarantine is content-addressed and propagates, so a blob known to be infected
  on one server is not served or re-fetched elsewhere, and self-heal never resurrects
  it (see `integrity.md`).
- [ ] What is known about content and what a server holds are recorded separately:
  the known-bad fact travels between servers, while a server's blob registry describes
  only that server's own copies and stays local to it (see `content-addressing.md`).
- [ ] A copy of known-bad content arriving from any source — an upload, a peer's
  copy, a restored backup — leaves the quarantine standing. The hash names the same
  content, so a copy that verifies is the same malware verified.
- [ ] A verdict that arrives after the content has been served revokes it: the
  records referencing the content stand, the content stops being served, and the
  known-bad fact propagates as it does for any other infected blob.
