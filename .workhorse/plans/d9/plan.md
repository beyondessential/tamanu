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

- `@tamanu/constants` (`packages/constants/src/ai.ts`) declares each context's tags and markers, next to `AI_CONTEXT_NAMES`. It lives there rather than in central-server because the web client emits `[PROGRAM SELECTED]` itself (`AiFormBuilderView.jsx`). Every emitter imports from it rather than inlining strings, so the declared set is the emitted set
- Structured-output field paths are derived from the zod schemas (`formBuilderChatResponseSchema`, `programDefinitionSchema`, `formBuilderTweakResponseSchema`), not declared by hand. Derive them from the JSON schema LangChain's `withStructuredOutput` actually sends, so the ledger records what the model sees rather than zod internals
- A committed ledger records every token and path that has shipped, per context. Breaking changes are allowed through by moving the entry to a `removed` list with `removedIn` and `reason`
- A pure test (no DB, no model calls) enforces: every current token is in the ledger (additive, just add it); every active ledger token is still current (breaking, restore or mark removed); no token is both active and removed
- The upgrade-check skill lists ledger removals between versions, prompting a check of deployments with overridden AI prompts

Deleting an active ledger entry outright, alongside the code, is left to review. No CI step diffs the ledger against `origin/main`.

### Findings from grounding

- Markers are emitted from three places: `admin/formBuilder.js` (file-context, build and tweak markers), `AIService.getSessionTranscript` (`[human]` and `[ai]` role markers, which feed the build input when there is no current definition), and the web client (`[PROGRAM SELECTED]`)
- `[CSV DOCUMENT LOADED]` and `[TEXT DOCUMENT LOADED]` are chosen by a dynamic `tag` variable in `formBuilder.js`, so a grep for the literal misses them. The refactor makes both explicit constants
- Central-server tests run on vitest. The setup file only closes database connections if a suite opened one, so a pure test needs no test context
- Ledger tokens take their natural form, so the kind is readable from the token: `<encounter_data>` for tags, `[LATEST USER REQUEST]` for markers, `surveySheets[].questions[].code` for output field paths
- Annotations with a baked-in value (`[Sheet: <name>]` in workbook context, `[File content truncated to N characters]`) are not section markers and no prompt refers to them, so they are outside the protocol
- Structured-output paths come from `toJsonSchema` in `@langchain/core/utils/json_schema`, which `ChatAnthropic.withStructuredOutput` uses for its default function-calling method. Literal values a field is constrained to are recorded too (e.g. `operations[].type=updateSurvey`), since renaming a tweak operation type breaks prompts that describe it
- The ledger's initial content is the current surface. TAM-7068's earlier change replaced free-text feedback formatting that had no markers, so there is no history to backfill

## Implementation

### Protocol constants

- [x] Add `AI_PROMPT_PROTOCOL` to `packages/constants/src/ai.ts`, keyed by `AI_CONTEXT_NAMES` value, each entry listing that context's `tags` and `markers`
  - patient summary: `patient_data`, `clinician_feedback`, `correction`, `ai_generated`, `clinician_edited`
  - encounter summary: `encounter_data` plus the same feedback tags
  - form builder: `[PROGRAM SELECTED]`, `[FORM IMAGE INTERPRETED]`, `[PDF DOCUMENT INTERPRETED]`, `[PDF DOCUMENT LOADED]`, `[CSV DOCUMENT LOADED]`, `[TEXT DOCUMENT LOADED]`, `[XLSX DOCUMENT LOADED]`
  - build: `[CURRENT PROGRAM DEFINITION]`, `[LATEST USER REQUEST]`, `[ASSISTANT RESPONSE]`, `[human]`, `[ai]`
  - tweak: `[CURRENT PROGRAM DEFINITION]`, `[LATEST USER REQUEST]`
- [x] Export named marker and tag constants that emitters import, so a single constant backs both the declaration and the emitted string

### Emitters use the constants

- [x] `packages/central-server/app/ai/summaryUserMessage.js`: build `DELIMITER_TAGS` from the summary contexts' declared tags, and emit tags through the constants
- [x] `packages/central-server/app/admin/formBuilder.js`: replace inline markers in the file-context builder, `readWorkbookContext`, `buildProgramDefinitionInput` and `buildProgramDefinitionTweakInput` with the constants, including the CSV/text `tag` branch
- [x] `packages/central-server/app/services/AIService.js`: emit `getSessionTranscript` role markers through the constants
- [x] `packages/web/app/views/administration/programs/surveys/aiFormBuilder/AiFormBuilderView.jsx`: emit `[PROGRAM SELECTED]` through the constant
- [x] Export `formBuilderChatResponseSchema` from `AIService.js` and `formBuilderTweakResponseSchema` from `formBuilder.js` so the test can read them (`programDefinitionSchema` is already exported)

### Ledger and test

- [x] Install dependencies in the worktree (`npm install`) and confirm which zod-to-JSON-schema conversion `withStructuredOutput` uses for Anthropic in the installed `@langchain/anthropic`; use the same conversion in the test
- [x] Add `packages/central-server/app/ai/promptProtocolLedger.json`: per context, `active` tokens and a `removed` list of `{ token, removedIn, reason }`, populated with the current surface
- [x] Add `packages/central-server/__tests__/ai/promptProtocol.test.js`, which gathers the current surface per context (declared tags and markers, plus output field paths flattened from the JSON schema) and enforces:
  - every current token is `active` in the ledger; the failure message says the addition is compatible and to add it
  - every `active` token is current; the failure message says this breaks deployment prompt overrides, and to restore the token or move it to `removed` with `removedIn` and `reason`
  - no token is both `active` and `removed`, and every `removed` entry has a version-shaped `removedIn` and a non-empty `reason`
- [x] Prove the test bites: temporarily rename a tag, a marker and an output field in turn, and confirm each fails with the breaking-change message; then revert

### Upgrade surfacing

- [x] `.agents/skills/upgrade-check/SKILL.md`: add a category under the configuration and data check that diffs the ledger's `removed` entries between the two versions (a source version predating the ledger counts every removal in the target), and flags that deployments with overridden prompts for those contexts need checking
- [x] `llm/project-rules/coding-rules.md`: add a one-line antipattern pointing at the ledger, so agents know removing or renaming a prompt protocol token is a breaking change

### Verification

- [x] Run the new test plus `__tests__/ai/encounterSummary.test.js` and `patientSummary.test.js` in central-server
- [x] Check the web client's `[PROGRAM SELECTED]` emitter by inspection and eslint (no web unit test covers `AiFormBuilderView`; `@tamanu/constants` is consumed from source, so no build step). Running it in the app is the manual test case
- [x] Lint the changed files with eslint
