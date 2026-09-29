# Prompt-builder backward compatibility

## Problem framing

Deployments editing AI prompts in settings is a supported workflow and is not policed. The check targets developers: a code change must not break a prompt that worked against the previous release.

The coupling is a protocol, not string substitution. Nothing substitutes placeholders into prompts; the system prompt is sent verbatim and data goes in the user message. The protocol a prompt may rely on is:

- delimiter tags in summary user messages (`summaryUserMessage.js`)
- bracketed markers in form builder messages (`admin/formBuilder.js`)
- data field names accepted by the strict zod schemas in the summary routes
- structured-output schema fields (`AIService.js`)

Additive protocol changes are compatible. Removals and renames are breaking.

## Candidate approaches (undecided)

- Protocol snapshot: tokens declared per context in one module, committed snapshot, removals fail CI
- Past-defaults corpus: every shipped default prompt frozen as a fixture; current code must still emit every token each fixture references
