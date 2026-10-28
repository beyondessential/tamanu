# Tamanu Knowledge Hub — card breakdown

Thirteen cards taking the Knowledge Hub from a platform decision to a deployed public site with the Tamanu in-app link pointed at it. Design for every surface is settled on card J8 and its mockups (`.workhorse/design/mockups/j8/` on the `workhorse/j8` branch) — cards build to those, they do not redesign. The one exception is the ref switcher, which postdates J8 and has no design yet.

Ordering is roughly dependency order. The platform spike gates the scaffold, the scaffold gates everything with a page in it, and the content pipeline gates the four content surfaces. Search, Ask AI, Report an issue and the deploy card are independent of each other once the scaffold lands.

**Two repositories.** The site lives in its own Knowledge Hub repository; the documentation markdown stays in the Tamanu monorepo. Every card except the in-app link one does its work in the hub repository, reading Tamanu's `docs/` across the repository boundary.

**Everything is per-ref.** Readers switch the hub between Tamanu release branches that carry documentation, so the content pipeline, the search index and Ask AI retrieval all work against a selected release rather than a single current set. Release notes are the exception: they are always read from `main`. The ref switcher itself has no design — J8 settled the top bar without it.

Migrating the existing Slab content is not in this breakdown. That is authoring work already running through the `draft-user-guide` (L8) and `draft-config-guide` (K8) skills, and it produces the markdown this site reads.

## Evaluate Docusaurus and settle the Knowledge Hub platform · U9

Decide what the hub is built on, with Docusaurus as the leading candidate and Vercel as the likely host since BES already runs an internal tool there. Validate Docusaurus against the constraints the PRD sets: a custom search-led home rather than a docs landing page, GitHub-faithful markdown rendering, content pulled from a **different repository** at a **selectable branch or tag**, per-ref site-wide search, and room to inject the Ask AI drawer into every page. The cross-repo and per-ref constraints are the sharp ones — Docusaurus's own versioning snapshots content into the site repository, which is the opposite of reading it live from a Tamanu ref, so whether that can be bent to fit is the question this card answers. Produce a decision with its rationale, and name the alternative if Docusaurus does not fit. No site code beyond whatever throwaway proving is needed.

## Scaffold the Knowledge Hub site and shell · V9

Stand the site up in the **Knowledge Hub repository** on the chosen platform, with routing for every surface and the shared chrome every page sits inside: the sticky navy top bar carrying Search, Ask AI, and the ref switcher, and the navy footer carrying the related-products links (Tupaia and SENAITE to the Knowledge Center, mSupply to the mSupply site). Carries the branding and design tokens from J8 — Tamanu palette, the category accents, the greyscale-type rule, the logo treatment — and settles Inter versus the app's Roboto. The hub repository currently exists only on a local machine, so this card also publishes it and registers it in the Tamanu Workhorse workspace. The ref switcher needs design before it can be built. Pages are empty shells at this point; the surface cards fill them.

## Build the documentation content pipeline · W9

Fetch the Tamanu repository's documentation markdown at a given ref and turn it into the hub's content model, so the surface cards render rather than parse. Owns the cross-repo fetch — how `beyondessential/tamanu` is read at a branch or tag, and how the set of available refs is discovered and refreshed. Covers `docs/user-manuals/desktop/`, `docs/user-manuals/mobile/`, `docs/user-manuals/config-guides/` and `docs/release-notes/`: the numbered folder and file naming that carries ordering, the hand-maintained README tables, titles and headings, images, and the navigation tree that falls out of the three guide categories. Also defines how the curated home and roadmap content is held in the Tamanu repository and read the same way. Everything downstream depends on this, so it lands before the surface cards — and since every other card is per-ref, this is where that shape is set.

## Build the user guides index and article pages · X9

The bulk of the hub: the guides index showing the three categories with their accents and module listings, and the article page with its sidebar, on-page navigation, and Report an issue link. Builds to the J8 `manuals-index` and `user-manual-article` mockups. Includes the "was this helpful" feedback control, which means settling the PRD's open question about where that response is captured.

## Build the release notes surface · Y9

Per-version release notes pages and an index spanning every version, rendered from `docs/release-notes/*.md` through the content pipeline — the `Released DD-MM-YYYY` line, the summary, and the emoji-prefixed category headings. Builds to the J8 `release-notes` mockup. Settles the open question of whether release notes follow the ref switcher like the guides do, or always present the full version history whatever ref the reader is on.

## Build the roadmap page · A10

The roadmap timeline, each card stating its own contents, built to the J8 `roadmap` mockup. Roadmap content is maintained through Workhorse and read from the Tamanu repository like the rest of the docs — not a live fetch from bes.au, and no authoring interface in the hub.

## Build the home and landing page · B10

The search-led hero with its Search and Ask AI entry points, plus the Popular, Recent features and Browse sections, built to the J8 `home` mockup. Recent features is curated in the Tamanu repository rather than derived from release notes, so this card settles the PRD's open question on how a feature maps to the guide it links to.

## Build global search · C10

Site-wide search across the hub's content at the ref the reader is on — desktop guides, mobile guides, configuration guides, and release notes — with the overlay built to the J8 `search-overlay` mockup. Owns a separate index per offered ref: how they are built, where they are stored, how they stay in step as refs move, and what happens to a search when the reader switches ref. Also owns the handoff that turns a search into an Ask AI question. Per-ref indexing is the part least likely to come free with the platform, so this card no longer shrinks the way a single-index search would have.

## Build the Ask AI retrieval service · D10

The backend behind the drawer: model, hosting, and retrieval over the hub content at the ref the reader is on, answering with the sources needed for inline citation and fast enough to feel in-context. Because the drawer is a conversation rather than a single question, this card owns how a thread's earlier turns are carried into each new retrieval and kept within the model's context as the thread grows. Carries the starting prompt and its guardrails from the PRD, and settles the open question of whether generating import spreadsheets is in scope for this phase. The drawer card can be built against a stub while this settles.

## Build the Ask AI drawer · E10

The page-aware chat drawer, as a **threaded conversation** rather than a single question and answer: the run of turns, each answer with its inline source citations, the follow-up input, and the entry points from the Ask AI control and from the search palette. Threads are session-only — held in the browser and gone when the tab closes, with no accounts and nothing stored server-side. Builds to the J8 `ask-ai` mockup, which already lays the drawer out as a thread — a "New chat" header, a user turn, an answer with its citations and feedback controls, and a follow-up input — so carrying it to a running conversation is mostly repeating that structure rather than new design. Includes the warnings the prompt calls for when a user enters patient-identifiable data or credentials.

## Build the Report an issue form · F10

The support form reachable from the top nav and the guides sidebar, built to the J8 `report-issue` mockup: Name, Email, Country or deployment, Describe the issue, and an optional screenshots drop zone carrying the obscure-patient-details warning. Submits by email to the BES support inbox, so this card owns how that send happens from a static site and how it is protected from abuse.

## Deploy the Knowledge Hub · G10

Get the built site published and keeping itself current across two repositories: the Vercel project on the Knowledge Hub repository, the public domain, and preview deploys for review. The cross-repo part is the work — a documentation change or a new release tag in the Tamanu repository has to reach the hub and rebuild the refs it affects, without a hub commit. Includes whatever secrets and environment the Ask AI service needs in the deployed environment.

## Point Tamanu's in-app support hub link at the Knowledge Hub · H10

The only card that touches the Tamanu application. Find every in-app location pointing at Slab for support or documentation and repoint it at the Knowledge Hub. Small, and it lands once the hub has a public URL.