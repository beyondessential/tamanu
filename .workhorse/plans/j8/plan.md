# Tamanu documentation and knowledge hub

A public-facing documentation website for Tamanu, leading with a global search that spans
user manuals and release notes, with an "ask AI" option. Design references: Stripe docs for
the search-led home and command palette; Linear for the user manual and release notes layout.

**Current phase:** nailing down architecture and navigation. Black-and-white palette only until
that settles, then colour and brand come later.

## Surfaces mocked (first pass)

Mockups under `.workhorse/design/mockups/j8/`:

- `home.html` — search-led landing (Stripe hero) with section cards for User manuals and Release notes, plus popular articles.
- `search-overlay.html` — global search command palette (⌘K). "Ask AI" leads the results; below it, grouped results from user manuals and release notes.
- `user-manual-article.html` — Linear docs layout: left grouped nav, centre content, right "on this page" TOC.
- `release-notes.html` — Linear changelog: left version index, centre reverse-chronological entries. Uses real v2.61–2.63 content.

## Content sources

- **Release notes** come from `docs/release-notes/*.md` in the GitHub repo (currently v2-61, v2-62, v2-63). Format: a `Released DD-MM-YYYY` line, a summary paragraph, then emoji-prefixed category headings (Major features, System enhancements, Tweaks and bug fixes, Critical upgrade notes, Upgrade steps).
- **User manuals** — source not yet decided. Some feature docs today live in Slab (release notes reference `[SLAB_LINK_PLACEHOLDER]`). Need to decide where manual content is authored and how it reaches the hub.

## Decisions taken

- **Deployment: standalone public docs site**, independent of the Tamanu app.
- **Hub scope: user manuals + release notes only** for now. API reference and the operational
  docs (`docs/runbooks`, `docs/sops`, `docs/reference`) stay out of the hub. Drop "API" from the
  top nav in the next revision.
- Black-and-white palette, Inter typeface, subtle 1px borders, generous whitespace.
- Shared top nav and left-sidebar pattern across manual and release-notes pages for consistency.

## Open questions (deferred by user)

- **User manual content source** — Markdown in-repo / Slab / CMS. Undecided; decide once layout
  settles. Structure of manual sections depends on this.
- **Ask AI surface** — inline answer in the palette vs a dedicated answer view. Undecided; design
  the search results first.
- Versioning: do manuals track Tamanu versions, or is there one current manual set?
