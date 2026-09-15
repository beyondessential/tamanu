# Tamanu documentation and knowledge hub

A public-facing documentation website for Tamanu, leading with a global search that spans
user manuals and release notes, with an "ask AI" option. Design references: Stripe docs for
the search-led home and command palette; Linear for the user manual and release notes layout.

**Current phase:** nailing down architecture and navigation. Black-and-white palette only until
that settles, then colour and brand come later.

## Surfaces mocked

Mockups under `.workhorse/design/mockups/j8/`:

- `prototype.html` — **all surfaces combined into one clickable prototype**: view switching between
  home / manuals / article / release notes, plus working search palette (`/` or ⌘K) and Ask AI
  drawer. The single-page files below remain as the per-surface references.
- `home.html` — search-led landing. Top bar carries Search and a separate Ask AI control (Stripe pattern). Hero leads with a large search + Ask AI, then Linear-style icon-panel card grids (Popular, Browse).
- `manuals-index.html` — the manuals section landing: Linear docs-home layout (left expandable
  sidebar + footer cluster). The browse area is a grid of **topic cards** (one per feature area,
  keeping the topic icon): each card lists a few of its articles and a "View all" link, which scales
  better than one card per article when there are many manuals.
- `user-manual-article.html` — Linear docs article: left grouped nav, centre content, right "on this page" TOC.
- `release-notes.html` — Linear changelog, master-detail: the left version list is the contents,
  and the reader clicks a version to view that release's notes on their own (one release shown at a
  time, latest selected by default — no endless scroll). Content is the **full verbatim** text of
  `docs/release-notes/v2-61..63.md` — every section (features, enhancements, fixes, critical upgrade
  notes, upgrade steps), the real `DD-MM-YYYY` dates, and the `[SLAB_LINK_PLACEHOLDER]` links. The
  sidebar lists only the versions that exist in the repo.
- `roadmap.html` — a Roadmap section built as a **horizontal timeline** after the Microsoft 365
  roadmap "Latest announcements" area: period cards zig-zag above and below a central axis of status
  markers (Released = filled, Planned = dashed), with prev/next navigation and a "View details"
  button per card. Content is the **real Tamanu roadmap** (from https://www.bes.au/tamanu-roadmap/):
  V2.24 Jan 25, V2.34 Jun 25, V2.40 Sept 25 (released), then Oct–Dec 2025, Jan–Mar 2026, Apr–Jun 2026
  (planned), plus the roadmap disclaimer. Reachable from the top nav.
- `report-issue.html` — a "Report an issue" support form: Name, Email, Country or deployment (select),
  Describe the issue (textarea), Screenshots drop zone (optional) with a "obscure patient details"
  warning, and a Submit button. Reachable from the top nav and the manuals sidebar (not in the
  home Browse row, which holds User manuals, Release notes and Roadmap). Rendered in the mono palette
  (the reference's amber warning and blue link kept monochrome for now).
- `search-overlay.html` — global search palette. An "Ask AI assist" card sits at the top and always
  opens the Ask AI drawer. With nothing typed, the body shows a single **Popular** list: the top five
  most-accessed items across both user manuals and release notes. Once the user types, it switches to
  the query view: a suggested question echoing the typed term, then document results grouped by
  manuals / release notes.
- `ask-ai.html` — Stripe-style Ask AI: a right-hand chat drawer with an answer, inline source citations, and a follow-up input. In the prototype the drawer carries the search query: opened from Ask AI assist it shows the typed question and its answer, or an empty chat state when nothing was typed.

Reference screenshots the user supplied: Stripe docs header (Search + Ask AI as two controls),
Stripe Ask AI chat drawer, Linear docs home (sidebar + card grid). Mockups follow these.

## Content sources

- **Release notes** come from `docs/release-notes/*.md` in the GitHub repo (currently v2-61, v2-62, v2-63). Format: a `Released DD-MM-YYYY` line, a summary paragraph, then emoji-prefixed category headings (Major features, System enhancements, Tweaks and bug fixes, Critical upgrade notes, Upgrade steps). The mockup reproduces these by hand; the **real hub must parse the markdown at build/runtime** rather than carrying transcribed copies (the earlier mockup diverged because it was hand-summarised, not pulled). The worktree's copies were confirmed identical to `origin/main`.
- **Roadmap** — content lives at https://www.bes.au/tamanu-roadmap/ and is now transcribed into the
  mockup (the user supplied it). Decision still open: whether the real hub fetches it live from
  bes.au or mirrors it into the repo, and how "View details" resolves (a per-release detail, or a
  link into release notes for shipped items).
- **User manuals** — source not yet decided. Some feature docs today live in Slab (release notes reference `[SLAB_LINK_PLACEHOLDER]`). Need to decide where manual content is authored and how it reaches the hub.

## Decisions taken

- **Deployment: standalone public docs site**, independent of the Tamanu app.
- **Hub scope: user manuals, release notes, a Roadmap, and a Report an issue support form.** API
  reference and the operational docs (`docs/runbooks`, `docs/sops`, `docs/reference`) stay out.
- **Tamanu-branded palette** over a mostly white page, Inter typeface, subtle 1px borders, generous
  whitespace. Colour is applied as a layer over the original neutral mockups (see "Branding" below),
  replacing the earlier black-and-white palette.
- Shared top bar (Search + separate Ask AI control) and Linear left-sidebar pattern across pages.
- **Search and Ask AI are two distinct controls** (Stripe pattern), not one combined bar.
- **Ask AI is a page-aware chat drawer** (Stripe pattern), reached from the Ask AI control or a
  hand-off in the search palette. This resolves the earlier "Ask AI surface" question.
- **Partner/sibling products live in the footer**, in a "Related products" group with external-link
  arrows and a "separate products" caption — Tupaia, Senaite, Senaite: Animal Health, mSupply. Kept
  out of the top nav and Browse so they don't read as Tamanu sections, since they are wholly separate
  products with only occasional crossover users. Real URLs still to be added (currently `#`), and the
  "Senaite: Animal Health" spelling to be confirmed (user wrote "Senate").

## Branding

Modelled on the Figma help centre (help.figma.com), read from the live site rather than from memory:
a white page broken up by full-bleed colour bands, borderless cards over flat colour thumbnails, big
light display type, and a dark capsule around the search.

- **Palette is the real Tamanu one**, taken from `packages/ui-components/src/constants/colors.js`
  (itself mirroring the Tamanu Figma colour library): primary blue `#326699` and gold `#FFCC24` as
  the brand pair, with green, purple, pink, amber and bright blue as category accents.
- **The brand mark is the shipped Tamanu logo** (`packages/web/resources/errors/tamanu_logo_blue_no_text.svg`),
  embedded as a data URI in a `--logo` custom property rather than redrawn.
- **Category tiles carry a rotating accent** driven by `nth-child`, so each card sets a local `--a`
  and `--a-10` pair that colours its icon, panel tint and hover state. Colour here is decorative
  wayfinding, not meaning.
- **Colour is load-bearing in two places only**: release-note section headings (blue major features,
  amber enhancements, green fixes, red critical upgrade notes, purple upgrade steps) and the roadmap
  timeline (blue delivered, gold planned). Emoji headings in the release notes were replaced by these
  coloured rules.
- Each mockup carries the same appended `Tamanu brand layer` block at the end of its stylesheet, so
  the branding can be tuned in one place per file and the original neutral rules stay readable
  underneath.
- **Page rhythm alternates band backgrounds** so no two dark sections touch: white hero, white
  Popular, navy Popular topics, gold Browse, navy footer.
- **The search sits in a navy capsule** holding a white pill input, a gold Ask AI pill and a row of
  quick-link chips. This is the hub's signature element, taken from the black capsule on the Figma
  help centre home.
- **Cards have no border or divider** — a flat colour thumbnail with a large icon, then a small
  uppercase tag pill, title and description beneath.
- **A gold announcement bar** runs above the top bar on every page, carrying the current release.
- **Display type is large and light** (hero 60px at weight 550, section headings 32px), not small and
  bold. Tracking is tight.
- Typeface is unchanged. The Tamanu web app uses Roboto; the docs hub stays on Inter as a separate
  surface. Worth confirming — Figma's own help centre leans on a distinctive grotesque, and Inter is
  the closest thing already in the mockups.

## Open questions

- **User manual content source** — Markdown in-repo / Slab / CMS. Undecided; decide once layout
  settles. Structure of manual sections depends on this.
- Versioning: do manuals track Tamanu versions, or is there one current manual set?
- Home vs manuals-index: whether the hub home is a distinct search-led page (current `home.html`)
  or whether the manuals landing doubles as the home. To confirm with the user.
