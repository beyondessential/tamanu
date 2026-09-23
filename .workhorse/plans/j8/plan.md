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
- `home.html` — search-led landing. Top bar carries Search and a separate Ask AI control (Stripe
  pattern). Hero leads with a large search + Ask AI, then two deliberately different grids.
  **Popular** is six real entries — a mix of user manuals and release notes — as outlined rows,
  each carrying the icon and label of its kind (user manual or release notes) rather than a
  per-article icon, so the kind is readable at a glance and the list can be generated from
  whatever the hub measures as popular. **Browse** stays as filled colour cards for the three
  destinations. The two treatments are distinct so the sections do not read as one long grid.
- **Home: Recent features** sits between Popular and Browse. It is a carousel of the six most recent
  major features (the `### _Feature_` headings in `docs/release-notes`, newest first; v2.63 has
  none, so they are v2.62's two and v2.61's first four). Three cards show at a time, stepped by
  arrows in the section header that switch off at either end. Each card has a 16:9 video area (the
  brand navy with a pink wash, a play button and "Video to come" until a video exists), the version
  and area, the feature title in sentence case, the first sentence of its release notes intro as the
  blurb, and two link rows: **Release notes** opens that version and scrolls to the feature, which
  briefly highlights; **User guide** opens the mapped guide (Medications settings lands on its
  "Dispensing quantity autocalculation" section). The feature-to-guide mapping is a proposal to
  confirm.
- `manuals-index.html` — the manuals section landing. **Superseded by the prototype's manuals view**,
  which carries the three-category structure (see "User manuals structure"); this standalone file
  still shows the earlier topic-card grid.
- The prototype also has a **configuration guide** view, reached from the Configuration guides tiles
  and sidebar entries.
- The roadmap is horizontal on desktop and **vertical on small screens**: the zig-zag rows collapse
  with `display:contents` so the cards re-order into one chronological column against a left rail,
  rather than forcing a sideways scroll on a phone.
- `user-manual-article.html` — Linear docs article: left grouped nav, centre content, right "on this page" TOC.
- `release-notes.html` — Linear changelog, master-detail: the left version list is the contents,
  and the reader clicks a version to view that release's notes on their own (one release shown at a
  time, latest selected by default — no endless scroll). Content is the **full verbatim** text of
  `docs/release-notes/v2-61..63.md` — every section (features, enhancements, fixes, critical upgrade
  notes, upgrade steps), the real `DD-MM-YYYY` dates, and the `[SLAB_LINK_PLACEHOLDER]` links. The
  sidebar lists only the versions that exist in the repo.
- **Release notes has one header for the whole section**, above the version list and notes rather
  than repeated in the content column: a dark tile in the Browse tiles' treatment, washed in the
  release notes pink, carrying the title and intro. Each release then opens with its own title, the
  version with its `Released DD-MM-YYYY` line from the source file (e.g. "v2.63 · Released
  03-09-2026").
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
  bes.au or mirrors it into the repo. The cards carry no "View details" affordance — each card states
  its own contents, so there is nothing further to open.
- **User manuals** — markdown in the repo under `docs/user-manuals/`, written by two skills on other
  cards: L8 (`write-user-guide`) for the desktop and mobile end-user guides, K8
  (`draft-config-guide`) for configuration guides under `config-guides/`. Both bring existing Slab
  content across. L8 also carries a `manifest.json` listing platforms, modules and guides, which the
  hub can read for its navigation. Like release notes, the hub parses this markdown rather than
  carrying copies.

## User manuals structure

User manuals has three principal categories. Their module lists come from the cards writing the
content, copied verbatim:

- **Tamanu desktop** — 22 numbered modules from card L8's `docs/user-manuals/desktop` (1 Accessing
  Tamanu Desktop … 22 Reports), each holding numbered guides (10.1 Record a set of vitals).
- **Tamanu mobile** — 13 numbered modules from L8's `docs/user-manuals/mobile` (1 Accessing Tamanu
  Mobile … 13 Sync).
- **Configuration guides** — 24 modules in set-up order from card K8's section README, and within
  each module its three guides: Reference data (*n*.1), Settings (*n*.2) and Permissions (*n*.3).
  This mirrors K8's folders (`docs/user-manuals/config-guides/<module>/{reference-data,settings,permissions}.md`).

**Placeholder content is the real content from those cards.** Every configuration guide page shows
K8's Medications guides (reference data, settings, permissions), and every desktop or mobile module
opens L8's "Record a set of vitals", the one end-user guide written so far. Formatting follows K8's
`.agents/docs/config-guide-format.md` for configuration guides and L8's `write-user-guide` skill for
end-user guides. The prototype renders the markdown at build time from those files.

Design notes:

- **The sidebar is one component across the index, article and config guide pages**: a collapsible
  group per category, headed by its accent dot, with numbered modules beneath. The page's own
  category is expanded and the others collapse.
- **Selected and hover never look alike in a sidebar**: hover is the light blue tint, and the
  selected row (current release version, current guide or article) is the brand navy with white text,
  matching the selected guide tab. This holds across the release notes, User manuals and article
  sidebars.
- **Module rows are independent disclosures**: clicking a row opens or closes its guides, any number
  can be open at once, and the guides themselves are the links. Arriving at a guide opens its module
  and leaves any other open modules as they were. A desktop or mobile module with no written guides
  has no chevron and links straight through.
- **Module and guide numbers show wherever they are listed** (sidebar, index tiles, article title),
  in muted tabular figures.
- **Each category holds one accent** across its sidebar dot, index header and tile hover: desktop
  purple, mobile bright blue, configuration red. Amber was tried for configuration but blurs into a
  muddy olive over the navy (any yellow does), so red is used.
- **The index opens each category with a dark header band** in the Browse tiles' treatment: navy,
  frosted icon chip, and the category accent blurred from the top-right corner.
  Outlined module tiles sit beneath, carrying L8's one-line module descriptions for desktop and
  mobile; configuration modules have none.
- **The config guide page is titled with the module**, with crumbs Configuration guides / Module /
  Guide, and a tab strip under the title switches between the module's three guides. The selected
  tab is navy. The article page is titled with its numbered guide title.

### How guides render on the docs site

**Guide content renders exactly as GitHub renders it**, the "On GitHub" column of the format doc's
rendering table, rather than being restyled for the site. Guides are markdown in the repo and GitHub
strips any styling, so matching GitHub keeps one appearance on both surfaces. The site's own chrome
(top bar, sidebar, crumbs, title, guide tabs, on-page contents, feedback) stays in the site's style
around it.

- The content area uses GitHub's light markdown theme, taken from `github-markdown-css`: GitHub's
  font stack, `#1f2328` text, `#0969da` links (underlined on hover), grey-bordered tables with bold
  headers and striped rows, light grey code blocks, grey-ruled blockquotes and GitHub's thick `hr`.
- Alerts render as GitHub alerts: a coloured left rule, and the octicon and label (Note, Tip,
  Caution, Warning) in the kind's colour.
- The required `*` is plain. K8's `> **Screenshot needed:** …` notes show as ordinary blockquotes
  and L8's `**[Screenshot: …]**` notes as bold text, as on GitHub.
- End-user steps are GitHub's plain numbered list.
- Headings sit one level under the page title (a guide's `#` renders as an `h2`) but keep the size
  and underline GitHub gives their source level. Anchors use GitHub's heading slugs.
- Links keep working: in-page anchors, links between a module's three guides (with anchors), and
  links to other configuration modules.
- Opening a module goes straight to its first guide. There is no module overview page yet, though
  K8's module READMEs (scope warnings, the IV medications explainer) would naturally live there.

## Decisions taken

- **Deployment: standalone public docs site**, independent of the Tamanu app.
- **Site name: Tamanu Knowledge Hub**, shown as the Tamanu mark and wordmark with "Knowledge Hub" as
  the secondary label in the top bar and footer, and in page titles.
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
  products with only occasional crossover users. Links point at the BES support centre for Tupaia,
  SENAITE and SENAITE Animal Health, and at `docs.msupply.org.nz` for mSupply, opening in a new tab.
  Labels read "Tupaia", "SENAITE", "SENAITE: Animal Health" and "mSupply"; SENAITE is capitalised to
  match the support centre and the roadmap copy, which already used caps.

## Branding

Modelled on the Figma help centre (help.figma.com), read from the live site rather than from memory:
a white page broken up by full-bleed colour bands, borderless cards over flat colour thumbnails, big
light display type, and a dark capsule around the search.

- **Palette is the real Tamanu one**, taken from `packages/ui-components/src/constants/colors.js`
  (itself mirroring the Tamanu Figma colour library): primary blue `#326699` and gold `#FFCC24` as
  the brand pair, with green, purple, pink, amber and bright blue as category accents.
- **The brand mark is the shipped Tamanu logo** (`packages/web/resources/errors/tamanu_logo_blue_no_text.svg`),
  embedded as a data URI in a `--logo` custom property rather than redrawn.
- **Each card sets a local `--a` and `--a-10` pair** that colours its icon, panel tint, label and
  hover state. On the manuals index these rotate by `nth-child` as decorative wayfinding; on the home
  page they are **semantic and fixed**: user manuals purple `#4101C9`, release notes pink `#D10580`,
  roadmap green `#19934E`. The same three hold across both the Popular rows and the Browse tiles, so
  a kind keeps one colour wherever it appears.
- **Type is black and greyscale only.** Colour never lands on the words: it carries on icons, panel
  fills, section rules, borders and button backgrounds, and the text over them stays ink (or white on
  the navy bar and footer). Body links are black and underlined rather than blue.
- **Colour is load-bearing elsewhere too**: release-note section headings (blue major features,
  amber enhancements, green fixes, red critical upgrade notes, purple upgrade steps) and the roadmap
  timeline (blue delivered, gold planned).
- **The release-note headings keep the source's emoji** (🌟 major features, 🔧 enhancements,
  🐛 fixes, ⚠️ critical upgrade notes) exactly as they appear in
  `docs/release-notes/v2-6*.md`. They are content, not decoration, so the mockup reproduces them; the
  coloured rules sit alongside rather than replacing them.
- Each mockup carries the same appended `Tamanu brand layer` block at the end of its stylesheet, so
  the branding can be tuned in one place per file and the original neutral rules stay readable
  underneath.
- **The search sits in a navy capsule** holding a white pill input and a gold Ask AI pill. This is
  the hub's signature element, taken from the black capsule on the Figma help centre home.
- **Browse is a bento on the brand dark.** Five directions were explored (full tint, accent edge,
  dark with accent glow, bento, editorial rows) in a throwaway options sheet; the chosen combination
  is the bento layout wearing the dark treatment. Each cell is navy with a blurred wash of its kind's
  accent bleeding from the top corner. **User manuals leads**, spanning both rows, because it is what
  most people came for, and it earns the larger cell by listing its top sections as links rather than
  padding the space. Release notes and Roadmap stack beside it.
- **Popular wears the same dark treatment in its own layout.** Five uplifts were explored (light
  glow, dark minis, hairline rows, ranked, kind stripe); the chosen combination takes the dark minis'
  colour — navy with the kind's accent blurred from the top corner — while keeping Popular's compact
  row: icon chip at the left, kind label, title and section stacked beside it. The two sections now
  read as one family. **Popular is the light inverse of a Browse tile**: no fill at all, so the page
  canvas shows through, outlined in its own kind colour at 40% strength — purple for a user manual,
  pink for a release note — with the same blurred accent wash from the same corner, the same lift on hover, ink type, and
  the accent repeated in the icon chip. The outline makes the kind readable from the card's edge
  rather than only from its label. Holding Popular at a percentage of the brand dark was tried first and abandoned — the
  difference was only about 20 levels per channel, which the glow on top swamped, and lightening
  further would have pushed the muted white text under 4.5:1. The wash sits at 16% and the muted text
  is `--ink-2` rather than `--ink-3`, because the uppercase label overlaps the tint where `--ink-3`
  measured 3.5:1. The outline is lightened rather than narrowed: a border cannot render under one
  device pixel, so `0.75px` snaps back to the same solid hairline as `1px` at every density, and
  reducing the colour is the only way to take weight out of it. On a 1px line the change has to be
  large to register: 75% was indistinguishable from full strength, and the difference only becomes
  legible below about 55%.
- **The page sits on a soft neutral canvas** (`#F3F5F7`, Tamanu's own `background` token) rather
  than white, with the sticky top bar, cards, inputs, the search palette and the Ask AI drawer kept
  white so they read as surfaces on it. **Release notes is the exception and reads on white**, since
  it is a long unbroken run of prose. The global search mockup keeps its dark stand-in backdrop.
- **The top bar exists in two markup variants** across the mockups (`nav.links`/`.searchbox`/`.k` on
  most pages, `nav.top`/`.nav-search`/`.kbd` on release notes and the article). Any bar-level styling
  has to cover both, or those two pages silently keep the old treatment.
- **The top bar is sticky and navy**, the same `#2F4358` as the footer, so the page is bracketed by
  the brand dark at both ends. It carries a white search pill and a gold Ask AI pill, making it a
  compressed echo of the hero capsule, and gains a shadow once the page scrolls beneath it. It was
  always `position: sticky`; the old translucent white background was what made the pinning
  imperceptible.
- **The top bar is responsive in three steps.** Above 1080px it is the full bar. From 1080px it
  tightens its gaps, narrows the search and drops the `/` hint. At 900px and below everything folds
  behind a hamburger: brand and menu button on one row, the links, search and Ask AI stacking beneath
  when open. 900px is the breakpoint because the four links plus search and Ask AI stop fitting a
  little above tablet portrait width.
- **Small screens needed page-level fixes, not just bar fixes.** The mockups overflowed sideways at
  phone widths, which made the sticky bar wider than the viewport and pushed the menu button
  off-screen entirely. Sidebar layouts collapse to a single column, hero and heading type scale down,
  and card grids go to one column. The long in-section navs (article, manuals index) drop out on
  mobile rather than burying the content; the release-notes version list is short and stays.
- **Gold is reserved for the brand word and the Ask AI action.** The active nav link is white rather
  than gold, so the bar does not carry three competing gold elements.
- **Display type is large and light** (hero 60px at weight 550, section headings 32px), not small and
  bold. Tracking is tight.
- **The styling layer adds no content.** An earlier pass introduced a Popular topics section, card
  tag pills, hero quick-link chips and a release announcement bar; all were removed and the home
  page returned to its original structure (hero, Popular, Browse). Colour work must not change what
  the page offers.
- Typeface is unchanged. The Tamanu web app uses Roboto; the docs hub stays on Inter as a separate
  surface. Worth confirming — Figma's own help centre leans on a distinctive grotesque, and Inter is
  the closest thing already in the mockups.

## Open questions

- **User manual content source** — Markdown in-repo / Slab / CMS. Undecided; decide once layout
  settles. Structure of manual sections depends on this.
- Versioning: do manuals track Tamanu versions, or is there one current manual set?
- Home vs manuals-index: whether the hub home is a distinct search-led page (current `home.html`)
  or whether the manuals landing doubles as the home. To confirm with the user.
