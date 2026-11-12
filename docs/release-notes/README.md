# Release notes

Public release notes for each Tamanu version, written for project managers and
system administrators rather than developers.

Every version is **two files, and the pairing is deliberate**:

- `vX-YY.md` is the source of truth for the wording.
- `vX-YY.html` is a styled rendering of that same wording, kept standalone with
  inline CSS so it can be emailed, printed, or pasted into a published page.

The two say the same thing on purpose. They are not duplicates to be reconciled:
removing either one loses something, and the HTML must never say anything its
markdown twin does not. When wording changes, change both in the same pass.

Both files are produced by the Draft release notes skill
(`.agents/skills/draft-release-notes/SKILL.md`), which is the place to change how
they are written or structured.
