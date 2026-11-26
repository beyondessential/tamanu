# Review loop log: U8

Local review of the card's branch against its base, as the hosted Review Hero would review the pull request.

## Setup

- Base: `origin/main` at 2f4765e402. Head at start: 91978bd3f0.
- Rigour: not named in the turn, so Standard is assumed: two clean rounds in a row, the second by fresh eyes, clean meaning no critical and three suggestions at most, cap of five rounds.
- Scope: `packages/database/src/models/fhir/FhirImagingStudy.ts`, its tests in `packages/central-server/__tests__/hl7fhir/materialised/ImagingStudy.test.js`, `specs/imaging/results.md`, and line references in `docs/runbooks/rispacs-imaging-not-received.md`. The card's test cases file is card scratch and not reviewed.
- Reviewer configuration, suppressions and conventions read from `origin/main`. One suppression rule (styled-components attrs), which cannot match this diff.
- Rejections on the card at start: none.
- The diff changes none of the branch's instruction files (`AGENTS.md`, `CLAUDE.md`, `.claude/`, `.agents/`, `llm/`) and there is no `.mcp.json`. `.claude/settings.json` holds a SessionStart hook only; `.claude/agents/` holds `hotfix-propagator` and `local-review-fix`.
- Reviewers run as Explore agents: no edit or write tools, but they do have shell access, so read-only is partly by instruction.
- Reviewers that apply: bugs and correctness (sonnet), security (opus), performance (sonnet), design and architecture (fable), BES Requirements (sonnet), Integration tests (sonnet).
- Reviewers that do not apply: accessibility (no UI in the diff), E2e tests (backend-only change, which that reviewer's own prompt excludes).
- Diff and bulk reports: the card's work directory, under `review/`.

## Round 1

Six reviewers, head 91978bd3f0. Found after triage: 0 critical, 5 suggestions, 5 nits. Not clean (more than three suggestions). `report_round` was refused: no review loop run is open in this conversation, so rounds are recorded here only. Findings are filed as issues on the card.

| Finding | Raised by | Severity | Decision |
|---|---|---|---|
| Lookup does not filter on visibilityStatus | bugs, BES | not counted | Wrong: nothing sets an imaging result's visibility away from current and no reader filters on it. Rejected. |
| Find-then-create is not atomic | bugs | suggestion | Skipped: predates the change and is not altered by it. |
| Integration results recognised by column values; facility route lets a client set them | security, design, bugs | suggestion | Needs a card: facility route and possibly a schema change. |
| Tests pin only the link predicate | design, Integration tests | suggestion | Fixed in b7c530db7d. |
| Newest-first ordering untested; arranging post unchecked | Integration tests | suggestion | Fixed in 36263a14f5. |
| Runbook defines a RIS/PACS result by completed_by_id alone | design | suggestion | Fixed in 0360d2bdae. |
| Spec and comment describe the match as provenance | BES, design | nit | Fixed in 1a3c9ce3d6. |
| Spec note gives no reason for leaving accession results alone | design | nit | Fixed in 1a3c9ce3d6. |
| Endpoint address not checked as an http(s) URL | security | nit | Needs a card: predates the change, and may reject viewer links in use. |
| Test helpers repeat inline arrange blocks | design | nit | Skipped: only pays off by rewriting six existing tests. |
| Cases start from Completed; block sits mid-suite | Integration tests | nit | Skipped: the completing line is untouched and an existing test posts to a pending request. |

Performance came back clean.

Re-check of the test fixes, by the orchestrator and not the fixer: with `completedById: null` removed the hand-entered-with-a-link case fails; with `externalCode: null` removed the accession case fails; with the ordering removed or flipped the newest-first case fails. One failure each, model file restored after each.

Checkpoint: eslint and prettier clean on the two changed code files; ImagingStudy and transaction bundle tests 34 of 34. The first checkpoint run had one failure in `logs the request even if not handled`, an existing test that documents itself as intermittent; it passed on three reruns. That first run also named the transaction bundle file at the wrong path, so only the ImagingStudy file ran in it.

## Round 2

Cold round: every reviewer that applies, fresh agents, given no earlier findings. In flight.
