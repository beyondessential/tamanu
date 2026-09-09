# Tamanu documentation and knowledge hub

A public-facing documentation website for Tamanu, leading with a global search that spans
user manuals and release notes, with an "ask AI" option. Design references: Stripe docs for
the search-led home and command palette; Linear for the user manual and release notes layout.

**Current phase:** nailing down architecture and navigation. Black-and-white palette only until
that settles, then colour and brand come later.

## Surfaces mocked

Mockups under `.workhorse/design/mockups/j8/`:

- `home.html` — search-led landing. Top bar carries Search and a separate Ask AI control (Stripe pattern). Hero leads with a large search + Ask AI, then Linear-style icon-panel card grids (Popular, Browse).
- `manuals-index.html` — the manuals section landing: Linear docs-home layout (left expandable sidebar + footer cluster, right card grid of Popular and category sections).
- `user-manual-article.html` — Linear docs article: left grouped nav, centre content, right "on this page" TOC.
- `release-notes.html` — Linear changelog: left version index, centre reverse-chronological entries. Real v2.61–2.63 content.
- `search-overlay.html` — global search palette (typeahead results grouped by manuals / release notes), with an "Ask AI instead" hand-off in the footer.
- `ask-ai.html` — Stripe-style Ask AI: a right-hand chat drawer, page-aware (documentation context chip), with an answer, inline source citations, and a follow-up input.

Reference screenshots the user supplied: Stripe docs header (Search + Ask AI as two controls),
Stripe Ask AI chat drawer, Linear docs home (sidebar + card grid). Mockups follow these.

## Content sources

- **Release notes** come from `docs/release-notes/*.md` in the GitHub repo (currently v2-61, v2-62, v2-63). Format: a `Released DD-MM-YYYY` line, a summary paragraph, then emoji-prefixed category headings (Major features, System enhancements, Tweaks and bug fixes, Critical upgrade notes, Upgrade steps).
- **User manuals** — source not yet decided. Some feature docs today live in Slab (release notes reference `[SLAB_LINK_PLACEHOLDER]`). Need to decide where manual content is authored and how it reaches the hub.

## Decisions taken

- **Deployment: standalone public docs site**, independent of the Tamanu app.
- **Hub scope: user manuals + release notes only** for now. API reference and the operational
  docs (`docs/runbooks`, `docs/sops`, `docs/reference`) stay out of the hub. Drop "API" from the
  top nav in the next revision.
- Black-and-white palette, Inter typeface, subtle 1px borders, generous whitespace.
- Shared top bar (Search + separate Ask AI control) and Linear left-sidebar pattern across pages.
- **Search and Ask AI are two distinct controls** (Stripe pattern), not one combined bar.
- **Ask AI is a page-aware chat drawer** (Stripe pattern), reached from the Ask AI control or a
  hand-off in the search palette. This resolves the earlier "Ask AI surface" question.

## Open questions

- **User manual content source** — Markdown in-repo / Slab / CMS. Undecided; decide once layout
  settles. Structure of manual sections depends on this.
- Versioning: do manuals track Tamanu versions, or is there one current manual set?
- Home vs manuals-index: whether the hub home is a distinct search-led page (current `home.html`)
  or whether the manuals landing doubles as the home. To confirm with the user.
