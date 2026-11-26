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

Five reviewers that found something in round 1 (bugs, security, design, BES Requirements, Integration tests), briefed with the ledger, head 97617f8832. Found after triage: 0 critical, 5 suggestions, 5 nits. Not clean. No finding matched a rejection.

| Finding | Raised by | Severity | Decision |
|---|---|---|---|
| Runbook's RIS/PACS definition still keys on completed_by_id | design, BES, security | suggestion | Fixed in 94693a7fd7: either an accession number or a link means RIS/PACS posted. This replaces the round 1 wording, which was wrong for rows a study had written over. |
| Nothing finds or repairs results already overwritten | security | suggestion | Needs a card: data recovery on live deployments. |
| Spec's hand-entry rules read as rules for every result | design | suggestion | Fixed in 9ffb8d3409: first section retitled, two bullets added, two wordings corrected. |
| Four add-alongside tests share one body; one misleading title | design | suggestion | Fixed in 890dd4913a: one table of four rows. |
| No test pins the lookup to the study's own request | Integration tests | suggestion | Fixed in cd97b38f7e. |
| Spec comment points at the whole spec; ordering unexplained | design | nit | Fixed in 9ffb8d3409. |
| Literals repeated between act and assert | BES | nit | Fixed in 39e936d524. |
| Ordering has no tie-breaker | bugs | nit | Skipped: a tie to the millisecond between two link-only results is not worth a second sort key. |
| Type import shares its name with the destructured model | BES | nit | Skipped: the file already does this with ImagingRequest. |
| No case with both a link-only and an accession result | Integration tests | nit | Skipped: raised as optional; the single-predicate cases cover it. |

One bugs note (explicit createdAt relies on Sequelize honouring it) asked for no change, since the test already guards it, and is not counted.

The runbook definition drew findings in both rounds. The round 2 wording drops the inference from completed_by_id altogether, so there is no heuristic left in it to pick at.

Re-check of the test fixes, by the orchestrator: removing in turn the Completed by predicate, the accession-number predicate, the ordering (and flipping it), and the request scoping of the link-only branch each fails exactly one case, the one that names it.

Checkpoint: eslint and prettier clean on the three changed code files; ImagingStudy and transaction bundle tests 35 of 35.

## Round 3

The same five reviewers with the ledger, head 2e02e75bc4. Found after triage: 0 critical, 6 suggestions, 5 nits. Not clean. Bugs came back with nothing; Integration tests with nits only. No finding matched a rejection.

| Finding | Raised by | Severity | Decision |
|---|---|---|---|
| Runbook's test for an overwritten result misses results saved without a clinician | security | suggestion | Fixed in ae4d55fd36 by removing the passage. |
| Runbook names an overwritten record with no safe next step | security | suggestion | Fixed in ae4d55fd36 by removing the passage. |
| Runbook overstates what an overwritten result lost | design | suggestion | Fixed in ae4d55fd36 by removing the passage. |
| Spec does not say what an update changes | design | suggestion | Fixed in ae7fd7f091. |
| Spec note's reasoning rules out the update it justifies | design | suggestion | Fixed in ae7fd7f091. |
| Spec defines the earlier result after the bullet that uses it | BES | suggestion | Fixed in ae7fd7f091: one bullet. |
| Test table does not show which predicate each row guards | design, BES, Integration tests | nit | Fixed in 715aa13e23. |
| Runbook pointer and return-path sentence | design, BES | nit | Fixed in ae4d55fd36. |
| Completed means two things in adjacent spec bullets | design | nit | Fixed in ae7fd7f091. |
| Table callback's unused argument and flag | BES | nit | Skipped: preference; the flag exists because the clinician's id is not known when the table is defined. |
| Ordering untested on the accession-number branch | Integration tests | nit | Skipped: optional; needs concurrent posts to arise. |

The runbook passage on overwritten results, added in round 2, drew findings in a third round running. It was guidance for work this card does not do (finding and reviewing those rows, recorded as needing a card), so it is removed and not reworded. What that card will want from these rounds: a result saved without a clinician cannot be told from a RIS/PACS result once a study has written over it; the description was replaced only where the study carried report text; the row must not be edited by hand.

Checkpoint: eslint and prettier clean; ImagingStudy and transaction bundle tests 35 of 35.

## Round 4

Security, design, BES Requirements and Integration tests with the ledger. In flight.
