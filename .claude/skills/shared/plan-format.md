# Plan format

A plan is a per-feature **working document**: the technical approach plus a checklist of steps to build it. A spec describes product *behaviour*; a plan describes *how the work gets done* — the sequence of changes, the tradeoffs weighed, the notes jotted during refinement.

## Location

`docs/specs/<area>/<feature>-plan.md` (alongside the feature's spec), or on the working ticket — wherever the team keeps it.

## Format

Free-form markdown — a working document, not a structured spec.

- An H1 title.
- An optional summary paragraph.
- A mix of **prose sections** (tech-design notes, refinement notes) and **checklist sections** with `- [ ]` items.
- Headings and ordering chosen to suit the feature.

## Which skills write to it

The first skill to run creates the file; later skills edit it in place.

- **`/tech-design`** workshops the technical approach and writes rationale + decisions as prose notes (may be notes-only, no checklist yet).
- **`/plan-implementation`** drafts or refines the build checklist from the specs and the current code.
- **`/implement`** reads the checklist, ticks items (`- [ ]` → `- [x]`) as work completes, and expands a step into sub-items when it turns out larger than anticipated.

## Progress

- The checkbox state is the record of progress.
- While implementing, self-check against the plan and note when the work has drifted from it.
- Completion = all checkboxes ticked.
