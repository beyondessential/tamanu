# BES Documentation Site — Tamanu Knowledge Hub

## Overview

External-facing Tamanu documentation currently lives in Slab (`beyond-essential.slab.com`) — a hosted knowledge base disconnected from the codebase, so docs drift from the software and cannot version with Tamanu releases. This project builds the **Tamanu Knowledge Hub**: a standalone public documentation site, independent of the Tamanu app, that is the single home for external-facing Tamanu documentation. Design and full clickable prototype are done on card **J8** (`.workhorse/design/mockups/j8/`); this PRD carries that design forward into buildable components.

## Site identity & scope

- **Name:** Tamanu Knowledge Hub — Tamanu mark and wordmark with "Knowledge Hub" as secondary label
- **Deployment:** standalone public site, independent of the Tamanu application
- **In scope:** user manuals, release notes, roadmap, a Report an issue support form, global search, and Ask AI
- **Out of scope:** API reference, and operational docs (`docs/runbooks`, `docs/sops`, `docs/reference`) — these stay internal

## Audience

- **Implementation / project managers** — configuration guides for setting up modules
- **Clinical / end users** — desktop and mobile user manuals for day-to-day use
- **System administrators & implementation partners** — release notes, upgrade guidance, roadmap
- **Anyone hitting a problem** — self-serve search, Ask AI, and a route to report an issue

## Surfaces

Each surface is prototyped in J8. Detailed layout and interaction are in the mockups; the build shape is summarised here.

### Home

- Search-led landing (Stripe pattern): hero with a navy search capsule holding a search pill and a gold Ask AI pill
- **Popular** — outlined rows mixing user manuals and release notes, generated from what the hub measures as popular
- **Recent features** — carousel of the most recent major features, pulled from the `### _Feature_` headings in release notes, each linking to the release notes and a mapped user guide
- **Browse** — bento on the brand dark: User manuals (leads, spanning both rows), Release notes, Roadmap

### User manuals

Three principal categories, each with its own accent:

- **Tamanu desktop** — numbered modules, each holding numbered guides (from card L8)
- **Tamanu mobile** — numbered modules (from card L8)
- **Configuration guides** — modules in set-up order, each with Reference data / Settings / Permissions guides (from card K8)

- Shared collapsible sidebar across index, article and config-guide pages; category header band on the index
- Article page (Linear docs layout): left grouped nav, centre content, right "On this page" rail
- Every module has an overview page (its README), reached from the module breadcrumb
- Config-guide page titled with the module, tab strip switching between its three guides
- Responsive: On-this-page rail drops at tablet width, sidebar drops below 900px
- **Guides render exactly as GitHub renders the source markdown** (GitHub light markdown theme, GitHub alerts, heading slugs), with the site's own chrome around them

### Release notes

- Linear changelog, master-detail: left version list is the contents, one release shown at a time, latest selected by default
- One section header above the version list and notes; each release opens with its version and `Released DD-MM-YYYY` line
- Section headings keep the source emoji (🌟 major features, 🔧 enhancements, 🐛 fixes, ⚠️ critical upgrade notes) with colour-coded rules
- Reads on white (long unbroken prose)

### Roadmap

- Horizontal timeline (Microsoft 365 pattern): period cards zig-zag above/below a central status axis (Released = filled, Planned = dashed), prev/next navigation
- Vertical single column on small screens
- Each card states its own contents
- **Roadmap content is maintained through a dedicated interface** — a content-editing surface within the hub, rather than static repo markdown or a live fetch from bes.au. Implies an authored/stored content store and an authenticated editing route; detailed shape to be filled in during card shaping

### Report an issue

- Support form: Name, Email, Country or deployment, Describe the issue, optional Screenshots drop zone (with an "obscure patient details" warning), Submit
- Submits by email to the BES support inbox
- Reachable from top nav and manuals sidebar

### Global search

- Command palette (`/` or ⌘K): an Ask AI assist card at the top, a Popular list when nothing is typed, and results grouped by manuals / release notes once typing
- Spans user manuals and release notes

### Ask AI

- Page-aware chat drawer (Stripe pattern): answer with inline source citations and a follow-up input
- Reached from the Ask AI control or handed off from the search palette
- **In v1 scope** — model, retrieval over the docs, and hosting to be decided during card shaping

## Content sources & pipeline

The hub **parses source markdown at build (or runtime)** rather than carrying transcribed copies — the prototype's hand-transcribed content is a stand-in only.

- **Release notes** — `docs/release-notes/*.md` in the repo (`Released DD-MM-YYYY` line, summary, emoji-prefixed category headings)
- **User manuals** — markdown under `docs/user-manuals/`:
  - Desktop and mobile end-user guides from card **L8** (`write-user-guide` skill), with a `manifest.json` the hub reads for navigation
  - Configuration guides under `config-guides/` from card **K8** (`draft-config-guide` skill)
  - Both bring existing Slab content across
- **Roadmap** — content at `https://www.bes.au/tamanu-roadmap/`; live fetch vs mirror-into-repo undecided

## Platform, hosting & deployment

- **Content location** — the site and all docs markdown live in **this Tamanu monorepo** (under `docs/`), so docs version and PR alongside the code they describe
- **Static site generator / framework** — _to be decided during card shaping_. Constraints it must meet: a custom search-led home, GitHub-faithful markdown rendering, site-wide search, and the Ask AI drawer
- **Hosting & deployment** — where the built site is served and how it deploys on release _to be decided_
- **Search implementation** — index across manuals and release notes _to be decided_
- **Versioning** — the site presents **one current set** of manuals (always the latest); only release notes are per-version

## Branding & design

Fully explored in J8; modelled on the Figma help centre over the real Tamanu palette.

- Real Tamanu palette from `packages/ui-components/src/constants/colors.js` — primary blue `#326699` and gold `#FFCC24`, category accents (user manuals purple, release notes pink, roadmap green)
- Shipped Tamanu logo; Inter typeface (confirm vs the Tamanu app's Roboto); soft neutral canvas with white surfaces
- Sticky navy top bar bracketing a navy footer; search + Ask AI as two distinct controls
- Type is black/greyscale only — colour carries on icons, fills, rules and buttons, never on words
- **Related products** live in the footer only, as external links, kept out of the top nav so they don't read as Tamanu sections. Tupaia and SENAITE (incl. SENAITE: Animal Health) link to the current Knowledge Center site (which links through to Slab); mSupply links to the mSupply site

## Migration & rollout

- **Tamanu documentation is fully cut over** to the hub in one launch — Slab is retired for Tamanu content
- User manuals and config guides are being brought across from Slab by cards L8 and K8 as repo markdown
- Handle existing Slab links (README runbook links, external references) — redirect or update
- Release-note source files still carry `[SLAB_LINK_PLACEHOLDER]` links to resolve
- **Other products are not migrated** — the footer's related-products links point Tupaia and SENAITE at the current Knowledge Center site (which still links to Slab), and mSupply at the mSupply site

## Related cards & dependencies

- **J8** — documentation and knowledge hub design (this prototype)
- **L8** — `write-user-guide` skill and desktop/mobile end-user guide content
- **K8** — `draft-config-guide` skill and configuration guide content

## Open questions

- **Platform:** which static site generator (must meet the constraints above, and support the roadmap authoring interface)
- **Hosting & deployment:** where the built site is served and how it deploys on release
- **Ask AI:** model, retrieval, and hosting for the chat drawer
- **Roadmap interface:** where authored content is stored, who can edit, and how the editing route authenticates
- **Home vs manuals-index:** distinct search-led home, or does the manuals landing double as home?
- **Typeface:** Inter vs matching the Tamanu app's Roboto
- **Feature-to-guide mapping** for Recent features — the proposed mapping needs confirming
