# Prompt-builder backward compatibility

## Problem framing

Deployments editing AI prompts in settings is a supported workflow and is not policed. The check targets developers: a code change must not break a prompt that worked against the previous release.

The coupling is a protocol, not string substitution. Nothing substitutes placeholders into prompts; the system prompt is sent verbatim and data goes in the user message. The protocol a prompt may rely on is:

- delimiter tags in summary user messages (`summaryUserMessage.js`)
- bracketed markers in form builder messages (`admin/formBuilder.js`)
- data field names accepted by the strict zod schemas in the summary routes
- structured-output schema fields (`AIService.js`)

Additive protocol changes are compatible. Removals and renames are breaking.

## Approach: protocol ledger

Scope is the minimal protocol surface: delimiter tags, bracketed markers, and structured-output field paths. Data field names described in prose (e.g. "DIAGNOSES") are out of scope for now.

- `packages/central-server/app/ai/protocol.js` declares each context's tags and markers. `summaryUserMessage.js` and the form builder message builders import from it rather than inlining strings, so the declared set is the emitted set
- Structured-output field paths are derived by walking the zod schemas (`formBuilderChatResponseSchema`, `programDefinitionSchema`, `formBuilderTweakResponseSchema`), not declared by hand
- A committed ledger records every token and path that has shipped, per context. Breaking changes are allowed through by moving the entry to a `removed` list with `removedIn` and `reason`
- A pure test (no DB, no model calls) enforces: every current token is in the ledger (additive, just add it); every active ledger token is still current (breaking, restore or mark removed); no token is both active and removed
- The upgrade-check skill lists ledger removals between versions, prompting a check of deployments with overridden AI prompts

Deleting an active ledger entry outright, alongside the code, is left to review. No CI step diffs the ledger against `origin/main`.
