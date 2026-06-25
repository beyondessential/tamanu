# Test-cases format

A test-cases document captures the concrete scenarios that verify a feature is done. It serves two audiences at once: a tester running the scenarios by hand, and an agent writing automated tests against them. One checklist covers both — an item is ticked whether an automated test lands for it or a tester verifies it.

## Location

`specs/<area>/<feature>-test-cases.md`.

## Format

- An H1 title.
- An optional summary paragraph.
- Prose sections (setup notes, caveats, automation briefs) plus **checklist sections** of `- [ ]` scenarios.
- Each scenario is **one concrete verifiable step in operational voice** — a thing to do and the observable outcome. Avoid vague items like "test the feature".

## Traceability to specs

- Where a scenario directly verifies an acceptance criterion, cite that spec's id (e.g. "verifies spec: ALG"). A scenario may cite more than one.
- Scenarios without a citation are valid — they cover operational concerns (smoke checks, cross-browser, manual feel) the specs don't spell out.

## Progress

- Checkbox state is the record of verification progress.
- A ticked box means covered — by an automated test that exercises it or a tester who ran it by hand. The source (automated vs manual) isn't recorded.
- Completion = all checkboxes ticked.

## Which skills write to it

- **`/draft-test-cases`** produces or refines the scenario list from the specs and current code.
- **`/automate-test-cases`** writes automated tests for unticked scenarios, ticking each as its test lands.
- **`/implement`** adds scenarios as implementation surfaces them, and ticks those it covers with automated tests.
