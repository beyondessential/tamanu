# Tamanu Knowledge Hub — card breakdown

Thirteen cards taking the Knowledge Hub from a platform decision to a deployed public site with the Tamanu in-app link pointed at it. Design for every surface is settled on card J8 and its mockups (`.workhorse/design/mockups/j8/` on the `workhorse/j8` branch) — cards build to those, they do not redesign.

Ordering is roughly dependency order. The platform spike gates the scaffold, the scaffold gates everything with a page in it, and the content pipeline gates the four content surfaces. Search, Ask AI, Report an issue and the deploy card are independent of each other once the scaffold lands.

Migrating the existing Slab content is not in this breakdown. That is authoring work already running through the `draft-user-guide` (L8) and `draft-config-guide` (K8) skills, and it produces the markdown this site reads.

## Evaluate Docusaurus and settle the Knowledge Hub platform

Decide what the hub is built on, with Docusaurus as the leading candidate and Vercel as the likely host since BES already runs an internal tool there. Validate Docusaurus against the constraints the PRD sets: a custom search-led home rather than a docs landing page, GitHub-faithful markdown rendering, content sourced from `docs/` elsewhere in the monorepo rather than a site-local content root, site-wide search across guides and release notes, and room to inject the Ask AI drawer into every page. Produce a decision with its rationale, and name the alternative if Docusaurus does not fit. No site code beyond whatever throwaway proving is needed.

## Scaffold the Knowledge Hub site and shell

Stand the site up in the monorepo on the chosen platform, with routing for every surface and the shared chrome every page sits inside: the sticky navy top bar carrying Search and Ask AI as two distinct controls, and the navy footer carrying the related-products links (Tupaia and SENAITE to the Knowledge Center, mSupply to the mSupply site). Carries the branding and design tokens from J8 — Tamanu palette, the category accents, the greyscale-type rule, the logo treatment — and settles Inter versus the app's Roboto. Pages are empty shells at this point; the surface cards fill them.

## Build the documentation content pipeline

Read the monorepo's documentation markdown into the site's content model, so the surface cards render rather than parse. Covers `docs/user-manuals/desktop/`, `docs/user-manuals/mobile/`, `docs/user-manuals/config-guides/` and `docs/release-notes/`: the numbered folder and file naming that carries ordering, the hand-maintained README tables, titles and headings, images, and the navigation tree that falls out of the three guide categories. Also defines how the curated home and roadmap content is held in the repo and read the same way. Everything downstream depends on this, so it lands before the surface cards.

## Build the user guides index and article pages

The bulk of the hub: the guides index showing the three categories with their accents and module listings, and the article page with its sidebar, on-page navigation, and Report an issue link. Builds to the J8 `manuals-index` and `user-manual-article` mockups. Includes the "was this helpful" feedback control, which means settling the PRD's open question about where that response is captured.

## Build the release notes surface

Per-version release notes pages and an index spanning every version, rendered from `docs/release-notes/*.md` through the content pipeline — the `Released DD-MM-YYYY` line, the summary, and the emoji-prefixed category headings. Builds to the J8 `release-notes` mockup. Guides present one current set; release notes are the one surface that is per-version.

## Build the roadmap page

The roadmap timeline, each card stating its own contents, built to the J8 `roadmap` mockup. Roadmap content is maintained through Workhorse and read from the repo like the rest of the docs — not a live fetch from bes.au, and no authoring interface in the hub.

## Build the home and landing page

The search-led hero with its Search and Ask AI entry points, plus the Popular, Recent features and Browse sections, built to the J8 `home` mockup. Recent features is curated in the repo rather than derived from release notes, so this card settles the PRD's open question on how a feature maps to the guide it links to.

## Build global search

Site-wide search across all hub content — desktop guides, mobile guides, configuration guides, and release notes across every version — with the overlay built to the J8 `search-overlay` mockup. Owns how the index is built and kept current with the content, and the handoff that turns a search into an Ask AI question.

## Build the Ask AI retrieval service

The backend behind the drawer: model, hosting, and retrieval over the full hub content, answering with the sources needed for inline citation and fast enough to feel in-context. Carries the starting prompt and its guardrails from the PRD, and settles the open question of whether generating import spreadsheets is in scope for this phase. The drawer card can be built against a stub while this settles.

## Build the Ask AI drawer

The page-aware chat drawer: the answer with its inline source citations, the follow-up input, and the entry points from the Ask AI control and from the search palette. Builds to the J8 `ask-ai` mockup, including the warnings the prompt calls for when a user enters patient-identifiable data or credentials.

## Build the Report an issue form

The support form reachable from the top nav and the guides sidebar, built to the J8 `report-issue` mockup: Name, Email, Country or deployment, Describe the issue, and an optional screenshots drop zone carrying the obscure-patient-details warning. Submits by email to the BES support inbox, so this card owns how that send happens from a static site and how it is protected from abuse.

## Deploy the Knowledge Hub

Get the built site published and keeping itself current: the Vercel project, the build that runs when documentation or site code merges, the public domain, and preview deploys for review. Includes whatever secrets and environment the Ask AI service needs in the deployed environment.

## Point Tamanu's in-app support hub link at the Knowledge Hub

The only card that touches the Tamanu application. Find every in-app location pointing at Slab for support or documentation and repoint it at the Knowledge Hub. Small, and it lands once the hub has a public URL.
