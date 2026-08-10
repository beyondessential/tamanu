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
- [ ] A server opts in by naming the scanner it drives. Named none, it starts no
  scanner, runs no scan, and holds no verdicts, and every path behaves as it does on a
  deployment without this feature.
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
- [ ] Scanning is incremental and rate-limited, on its own budget rather than the
  integrity scrub's: never-scanned content first, then content scanned longest ago.
- [ ] Content larger than a configured size is left unscanned rather than sent to the
  scanner, since scanners cap what they will accept and a blob that always fails would
  otherwise take the head of the queue every pass. It is unscanned content like any
  other, and the serve policy decides what it does.
- [ ] Blobs are re-scanned when the scanner's signatures are updated. The scanner
  reports the signature version in force, and content whose recorded version is behind
  it is due again, so a signature update becomes a re-scan of the store without any
  separate notification.
- [ ] A blob with an infected verdict is not re-scanned: the verdict is terminal and
  its content is quarantined.
- [ ] The central server scans every blob it holds and its verdict is authoritative;
  a facility without its own scanner uses the central verdict.

## Serve policy

- [ ] The serve policy is an administrator setting with three postures: off, serve
  unless known-bad, and serve only when known-good. When no scanner is configured,
  behaviour is as if off.
- [ ] The policy applies deployment-wide rather than per server, so a facility cannot
  serve what central withholds.
- [ ] With the policy off, a server acts on no verdict of its own: content is served
  subject to access control and to quarantine. Verdicts are still recorded, so a
  deployment can turn scanning on, watch what it finds, and harden only once it
  trusts the result.
- [ ] A quarantine binds under every posture, off included. It is the deployment's
  standing record of content confirmed to be malware rather than one server's
  reading of its own content, and the posture governs the latter.
- [ ] Serve-unless-known-bad, the default once scanning is enabled, serves any blob
  that does not have an infected verdict, including not-yet-scanned content.
- [ ] Serve-only-when-known-good serves a blob only once it has a clean verdict;
  not-yet-scanned content is withheld until scanned.
- [ ] Serve-only-when-known-good binds on a server that scans, over content it holds.
  A server that drives no scanner holds no verdicts of its own and serves unless
  known-bad, which is how it serves on central's verdict rather than withholding
  everything it holds. Content a server has yet to hold is resolved rather than
  withheld: a scan reads stored content, so withholding a blob before it arrives
  would keep it from ever arriving or being scanned.
- [ ] Content withheld for want of a verdict is answered as awaiting its check, in
  the same shape as a content-pending reference (see `transfer.md`), so a client can
  tell content that is coming from content that is gone.
- [ ] Content withheld as infected is answered as such, distinctly from content that
  is pending, so a reader is told the content is not coming rather than left waiting
  on it.

## Quarantine

- [ ] A blob with an infected verdict is quarantined: retained rather than deleted,
  never served, and recorded against its hash.
- [ ] Quarantine is content-addressed and propagates, so a blob known to be infected
  on one server is not served or re-fetched elsewhere, and self-heal never resurrects
  it (see `integrity.md`).
- [ ] The propagating record names the hash rather than any copy of it. It is written
  by the central server, whose verdict is authoritative, and synchronised out to
  facilities and devices, which never write one.
- [ ] A server holds the record whether or not it holds the content, so a quarantine
  applies to content that arrives later as much as to content already held.
- [ ] The record reaches a facility or device through ordinary synchronisation, so it
  applies while that server is offline: a facility that has already cached known-bad
  content refuses it without needing to reach central.
- [ ] Known-bad content is never transferred: a server does not offer it, does not
  accept it when offered, and does not fetch it.
- [ ] A copy of known-bad content arriving from any source — an upload, a peer's
  copy, a restored backup — leaves the quarantine standing. The hash names the same
  content, so a copy that verifies is the same malware verified.
- [ ] A verdict that arrives after the content has been served revokes it: the
  records referencing the content stand, the content stops being served, and the
  known-bad record propagates as it does for any other infected blob.
- [ ] What a server holds and what is known about content are recorded separately: a
  server's blob registry describes its own copies and stays local to it (see
  `content-addressing.md`), while the quarantine record travels.
