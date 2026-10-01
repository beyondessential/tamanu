# BES Documentation Site — Tamanu Knowledge Hub

## Overview

External-facing Tamanu documentation currently lives in Slab (`beyond-essential.slab.com`) — a hosted knowledge base disconnected from the codebase, so docs drift from the software, cannot version with Tamanu releases, and are hard to search across. This project builds the **Tamanu Knowledge Hub**: a standalone public documentation site, independent of the Tamanu app and built from markdown in the Tamanu monorepo, that becomes the single home for external-facing Tamanu documentation. Design and a full clickable prototype are done on card **J8** (`.workhorse/design/mockups/j8/`); this PRD carries that design into buildable requirements.

**Goals:**

1. Replace Slab as the single home for external-facing Tamanu documentation
2. Improve searchability across all documentation
3. Give every audience an AI-assisted resource for configuring, operating, using, and keeping up with Tamanu

**Site identity & scope:**

- **Name:** Tamanu Knowledge Hub — Tamanu mark and wordmark with "Knowledge Hub" as secondary label
- **Deployment:** standalone public site, independent of the Tamanu application, built from the monorepo
- **Audience:** the full range of Tamanu users — implementation / project managers (config guides), clinical / end users (desktop and mobile manuals), system administrators and IT staff (deployment, upgrade guidance), and implementation partners and country teams (release notes, roadmap). No single audience is primary
- **In scope:** user manuals, release notes, roadmap, a Report an issue form, global search, Ask AI
- **Out of scope:** API reference, and operational docs (`docs/runbooks`, `docs/sops`, `docs/reference`) — these stay internal

---

## Priority summary

| # | Original request | Feature | Design work |
| --- | --- | --- | --- |
| 1 | Project brief | Site platform & scaffold | — |
| 2 | J8 | Ask AI | J8 (ask-ai) |
| 3 | J8, L8, K8 | User manuals | J8 (index, article, config pages) |
| 4 | J8 | Release notes | J8 |
| 5 | Project goal, J8 | Global search | J8 (search overlay) |
| 6 | J8 | Home / landing | J8 (home) |
| 7 | J8 | Roadmap & authoring interface | J8 (timeline); authoring UI needed |
| 8 | J8 | Report an issue | J8 (report-issue) |
| 9 | J8 | Branding & shared design system | J8 |
| 10 | Project brief | Migration & cutover from Slab | — |
| 11 | Project brief | Update Tamanu in-app support hub link | — |

---

## Requirements

### 1. Site platform & scaffold

The foundation: a public site built from monorepo markdown.

- Content and site live in **this Tamanu monorepo** (docs markdown under `docs/`), so docs version and PR alongside the code they describe
- **Static site generator / framework** — _to be decided during card shaping_. Must support: a custom search-led home, GitHub-faithful markdown rendering, site-wide search, the Ask AI drawer, and the roadmap authoring interface (so a purely static generator alone will not suffice)
- **Hosting & deployment** — where the built site is served and how it deploys on release _to be decided_
- **Versioning** — the site presents **one current set** of manuals (always the latest); only release notes are per-version
- Shared top bar (Search + separate Ask AI control) and footer across all surfaces

---

### 2. Ask AI

The main improvement to general documentation, serving every audience — configuring, operating, using, and keeping up with Tamanu. The core problem it solves (alongside global search) is the poor searchability of documentation in Slab across all content. Ask AI answers over the hub's content so anyone can ask a question and get a direct, cited answer rather than hunting across pages.

- Page-aware chat drawer (Stripe pattern): answer with inline source citations and a follow-up input
- Reached from the Ask AI control or handed off from the search palette
- Retrieves over the full hub content — user manuals, configuration guides, release notes, and roadmap
- In v1 scope; model, retrieval, and hosting _to be decided during card shaping_

---

### 3. User manuals

The bulk of the content moving off Slab, in three principal categories, each with its own accent:

- **Tamanu desktop** — numbered modules, each holding numbered guides (content from card L8)
- **Tamanu mobile** — numbered modules (content from card L8)
- **Configuration guides** — modules in set-up order, each with Reference data / Settings / Permissions guides (content from card K8)

Content is markdown under `docs/user-manuals/`, written by the `write-user-guide` skill (L8, with a `manifest.json` the hub reads for navigation) and the `draft-config-guide` skill (K8). The hub **parses this markdown** rather than carrying copies.

**Design updates.** Shared collapsible sidebar across index, article and config-guide pages; category header band on the index. Article page uses the Linear docs layout (left grouped nav, centre content, right "On this page" rail). Every module has an overview page (its README), reached from the module breadcrumb. Config-guide pages are titled with the module and carry a tab strip switching between the three guides. Guides **render exactly as GitHub renders the source markdown** (GitHub light markdown theme, GitHub alerts, heading slugs), with the site's chrome around them. Responsive: the On-this-page rail drops at tablet width, the sidebar below 900px.

---

### 4. Release notes

- Source is `docs/release-notes/*.md` in the repo, parsed by the hub (`Released DD-MM-YYYY` line, summary, emoji-prefixed category headings)
- `[SLAB_LINK_PLACEHOLDER]` links in the source files need resolving as part of this work

**Design updates.** Linear changelog, master-detail: the left version list is the contents, one release shown at a time, latest selected by default. One section header above the list and notes; each release opens with its version and `Released DD-MM-YYYY` line. Section headings keep the source emoji (🌟 major features, 🔧 enhancements, 🐛 fixes, ⚠️ critical upgrade notes) with colour-coded rules. Reads on white.

---

### 5. Global search

Directly serves goal 2 — improving searchability across all documentation, a weak point in Slab.

- Spans all content — user manuals, configuration guides, and release notes (across every version)
- Index built across the parsed content _implementation to be decided_

**Design updates.** Command palette (`/` or ⌘K): an Ask AI assist card at the top, a Popular list when nothing is typed, and results grouped by manuals / release notes once typing.

---

### 6. Home / landing

**Design updates.** Search-led landing (Stripe pattern): hero with a navy search capsule holding a search pill and a gold Ask AI pill. **Popular** — outlined rows mixing user manuals and release notes, generated from what the hub measures as popular. **Recent features** — carousel of the most recent major features, pulled from the `### _Feature_` headings in release notes, each linking to the release notes and a mapped user guide (the feature-to-guide mapping needs confirming). **Browse** — bento on the brand dark: User manuals (leads, spanning both rows), Release notes, Roadmap.

---

### 7. Roadmap & authoring interface

- Each card states its own contents; content is the Tamanu roadmap
- **Roadmap content is maintained through a dedicated interface** — a content-editing surface within the hub, not static repo markdown or a live fetch from bes.au. Implies a stored content store and an authenticated editing route

**Design updates.** Horizontal timeline (Microsoft 365 pattern): period cards zig-zag above/below a central status axis (Released = filled, Planned = dashed), prev/next navigation; vertical single column on small screens. The authoring interface itself still needs design.

---

### 8. Report an issue

- Support form: Name, Email, Country or deployment, Describe the issue, optional Screenshots drop zone (with an "obscure patient details" warning), Submit
- **Submits by email to the BES support inbox**
- Reachable from top nav and manuals sidebar

**Design updates.** Form layout prototyped in J8 (`report-issue.html`).

---

### 9. Branding & shared design system

Fully explored in J8; modelled on the Figma help centre over the real Tamanu palette.

- Real Tamanu palette from `packages/ui-components/src/constants/colors.js` — primary blue `#326699` and gold `#FFCC24`, category accents (user manuals purple, release notes pink, roadmap green)
- Shipped Tamanu logo; Inter typeface (confirm vs the Tamanu app's Roboto); soft neutral canvas with white surfaces
- Sticky navy top bar bracketing a navy footer; search + Ask AI as two distinct controls
- Type is black/greyscale only — colour carries on icons, fills, rules and buttons, never on words
- **Related products** live in the footer only, kept out of the top nav so they don't read as Tamanu sections. Tupaia and SENAITE (incl. SENAITE: Animal Health) link to the current Knowledge Center site (which links through to Slab); mSupply links to the mSupply site

---

### 10. Migration & cutover from Slab

- **Tamanu documentation is fully cut over** to the hub in one launch — Slab is retired for Tamanu content
- User manuals and config guides are brought across from Slab by cards L8 and K8 as repo markdown
- Handle existing Slab links (README runbook links, external references) — redirect or update
- **Other products are not migrated** — related-products footer links point Tupaia and SENAITE at the current Knowledge Center site (still on Slab), and mSupply at the mSupply site

---

### 11. Update Tamanu in-app support hub link

- Tamanu's in-app support hub link currently points at Slab; update it to the Tamanu Knowledge Hub as part of this work
- _Confirm the exact in-app location(s) during card shaping_

---

## Open questions

- **Platform:** which static site generator (must meet the constraints in requirement 1, including the roadmap authoring interface)
- **Hosting & deployment:** where the built site is served and how it deploys on release
- **Ask AI:** model, retrieval, and hosting for the chat drawer
- **Roadmap interface:** where authored content is stored, who can edit, and how the editing route authenticates
- **Home vs manuals-index:** distinct search-led home, or does the manuals landing double as home?
- **Typeface:** Inter vs matching the Tamanu app's Roboto
- **Feature-to-guide mapping** for the home Recent features carousel