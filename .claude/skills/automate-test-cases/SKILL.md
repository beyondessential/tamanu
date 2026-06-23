---
name: automate-test-cases
description: Write automated tests for the unticked scenarios in a feature's test-cases doc, ticking each as its test lands.
---

## Automate test cases

Write automated tests that match the unticked scenarios in the feature's test-cases doc, ticking each item as its test lands.

1. Read the test-cases doc (see `.claude/skills/shared/test-cases-format.md`). If none exists, stop and ask whether to run `/draft-test-cases` first.
2. For each unticked scenario, find the right place for its test — follow the repo's existing test conventions (framework, file layout, fixtures; see the testing rules in `llm/project-rules/`).
3. Write the test so it exercises the scenario as stated. If it cites a spec id, the test is the automation of that criterion — match its intent.
4. Tick the scenario (`- [ ]` → `- [x]`) once its test is written and passing locally; update the doc in place.
5. If a scenario genuinely isn't automatable (manual feel, cross-browser visual), leave it unticked and note why it's manual-only.
6. Summarise what you automated, what remains manual, and any scenarios you couldn't make sense of.
