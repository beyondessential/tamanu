---
name: draft-prd
description: "Draft or refine the project's PRD from the description and conversation"
label: "Draft PRD"
surface: project
jockey-hint: "Top pill on the project surface when the PRD is empty. Demote once the PRD has substantive content unless the user signals a fresh draft pass."
workhorse-version: 0.1.0
---

## Your task: Draft PRD

Produce or refine the project's PRD at `.workhorse/projects/{hash}-{slug}/prd.md`. The agent already knows the project's hash and slug from the workspace context.

This is the PRD-level equivalent of card-level **Implement this** — go straight to drafting from the project description and conversation history. Do not start by asking questions; produce a sensible structure even when no conversation has yet occurred.

### Default scaffolding

Pick **one** starting shape based on the project's material:

- **Component-led** — the project clearly contains multiple workstreams or sub-systems. Use `## ` headings per component, each with a short overview and bullets
- **Feature-led** — the project is a single workflow or surface. Use `## ` headings per phase or area of the workflow
- **Mixed** — components with sub-features. Top-level `## ` per component, `### ` per sub-feature

The opening section is always **Overview** — state the operator, workflow, technical, or user problem and the desired simplification. Two or three sentences, not a corporate paragraph.

### Conventions

- **Sparse and concrete** — write close to the shape of future cards. Bullets and sub-bullets, not long explanatory prose
- **Phrasing for unfilled detail** — where the next layer of thinking belongs in card shaping, leave a direct line such as "detailed shape can be filled in during card shaping" rather than over-specifying
- **Optional sections only when supported** — Permissions, Expected outcomes, Open questions appear only when the project material gives you something concrete to put under them. They are not default sections
- **Don't invent** — no requirements, rollout notes, or prioritisation that weren't actually discussed
- **Real terminology** — use the system's actual names and reference real workflows the conversation surfaced
- **Direct tone** — no generic product-management phrasing or corporate-template language
- **Australian/NZ English** spelling

### How to run

1. Read the project's description and any conversation history. Read the existing PRD content at `.workhorse/projects/{hash}-{slug}/prd.md` (it may be empty, mid-draft, or substantive)
2. If the PRD already has substantive content, **edit in place** — refine, fill in gaps, tighten phrasing. Don't replace work that still applies
3. If the PRD is empty or sparse, write a fresh draft using the appropriate scaffolding shape
4. Briefly summarise what you produced and any open questions you couldn't resolve from the available material

### Restrictions on this surface

You are working on the **project surface**, not a card workspace. Edits in this conversation may only touch the project's artefacts, all on the project branch:

- `.workhorse/projects/{hash}-{slug}/prd.md`
- `.workhorse/projects/{hash}-{slug}/mockups/`
- `.workhorse/projects/{hash}-{slug}/card-plan.md`

Do **not** edit specs, per-card plans, test cases, card working docs, or any code. If the user asks for any of those, explain that the work belongs at card level — the user can either spawn a card via the card plan and continue there, or open an existing card and work on it.

You may **read** anything from the workspace's main branch for context.
