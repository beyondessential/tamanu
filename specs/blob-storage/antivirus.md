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
- [ ] A blob is scanned on ingest, and its verdict is recorded by hash in the
  registry, so identical content is scanned once regardless of how many records
  reference it.
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

## Quarantine

- [ ] A blob with an infected verdict is quarantined: retained rather than deleted,
  never served, and recorded against its hash.
- [ ] Quarantine is content-addressed and propagates, so a blob known to be infected
  on one server is not served or re-fetched elsewhere, and self-heal never resurrects
  it (see `integrity.md`).
