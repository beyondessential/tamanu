# Tamanu knowledge hub design

Working notes for the knowledge hub page mockup.

## Decisions made

- **Public site**, outside the authenticated Tamanu web app. No login to browse.
- **Assist-first**: Tamanu Assist is the hero, with release notes, manuals and recent
  changes below it rather than beside it.
- **Audience is all three**: clinical staff, system admins, implementation teams. The
  three example questions in the hero are one per audience.
- **Version handling**: Assist asks which version the user is on only when the answer
  depends on it. No version selector in the page chrome.
- **Recent changes are curated by hand**, not derived from release notes. Each entry
  carries an image, laid out as one large featured card with two smaller cards beneath.
- **Community Q&A ships as a visible placeholder**, reserving its slot below the forms.
- **Feature request is a three-step wizard** (about you / the problem / the request).
  The issue report stays a single page at four questions.

## Open: where form submissions land

Undecided, and it blocks more than it looks like it does.

The page invites screenshots of Tamanu from an unauthenticated public form. Tamanu
screens contain patient data by default, so whatever receives these submissions becomes
a PII store. The mockup carries a "obscure patient details before attaching" warning on
both attachment fields, which is the weakest available control.

The choice determines three other things:

- **Whether submission requires a Tamanu login.** Authenticating kills spam and supplies
  the reporter's facility and version for free, at the cost of anonymous reports and an
  auth story on a public site.
- **Whether attachments can be accepted at all**, or whether the form should ask for a
  written description and handle files through a separate channel.
- **Retention and access.** A public issue tracker as the destination is a disclosure
  path; a private BES queue needs an owner.

Resolve before the forms are built, not after the first report arrives with a patient
list in a screenshot.

## Screenshots in recent changes must come from demo data

The recent-changes entries carry screenshots on a public page. Every image must be
captured from a demo or seeded deployment, never from a live one, and that needs to be a
standing rule for whoever curates the section each release rather than a one-off check.
Same exposure as the report forms, but pointed the other way: outbound rather than
inbound, and permanently public once posted.

## Open: where the user manuals live

The config-guide rules (`llm/project-rules/write-config-guides.md`) are written for Slab,
which suggests the manuals are in Slab today. If Slab is behind a login, the public hub
sends clinical staff into an auth wall, and Assist cannot read the manuals unless they
are mirrored somewhere it can reach.
