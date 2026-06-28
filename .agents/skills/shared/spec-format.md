# Spec format and information architecture

Shared conventions for the spec, plan, and test-case docs that the spec/design/test skills read and write. Specs are the product-level source of truth for a feature. The format serves three audiences: product owners and testers authoring them (via interview or direct edit), developers and AI agents implementing from them, and anyone browsing them as a knowledge base. The aim is durable, reusable specs — not throwaway notes tied to a single ticket.

The "card" these skills refer to is the feature/ticket you're working on (typically a Linear ticket). The originating card isn't recorded on the spec — it's available via git history and doesn't stay tied to the spec after the card closes.

## Where things live

- **Specs** (durable acceptance criteria / behaviour): `specs/<area>/<slug>.md`, organised into directories by product area.
- **Plans** (tech-design notes + build checklist for a feature): a working doc alongside the spec, e.g. `specs/<area>/<feature>-plan.md`, or the ticket itself.
- **Test cases** (verifiable scenarios): `specs/<area>/<feature>-test-cases.md`.
- **Mockups**: standalone HTML at `specs/<area>/mockups/<slug>.html`.

## Information hierarchy

The directory structure under `specs/` is the hierarchy: **Area > Subarea > ... > Spec**, with arbitrary nesting depth.

```
specs/
├── patient/
│   ├── registration.md
│   ├── allergies.md
│   ├── merge/
│   │   ├── overview.md
│   │   ├── field-resolution.md
│   │   └── conflict-handling.md
│   └── referrals.md
├── scheduling/
│   ├── appointments.md
│   └── recurring-appointments.md
└── labs/
    ├── requests.md
    └── results.md
```

Areas appear as they're needed — there's no predefined list. When drafting a new spec, pick an area consistent with the existing structure. Filenames are short kebab-case slugs; the area comes from the directory and the title comes from the H1.

## File format

Each spec is a markdown file with a structured body:

```markdown
# Patient allergies

Summary paragraph describing what this spec covers.

## Section heading

- [ ] Acceptance criterion one
- [ ] Acceptance criterion two
```

- **Title** — a single `#` H1 at the top, human-readable (e.g. "Patient allergies")
- **Summary** — one or two plain paragraphs below the title, no heading
- **Sections** — `##` headings group related criteria
- **Acceptance criteria** — markdown checkbox items (`- [ ]`), each concrete and independently verifiable

## Writing conventions

- **Acceptance criteria are facts about behaviour, not instructions to a developer.** Concrete and verifiable — "the cashier sees the fee on the invoice", not "handle fees well". Keep each criterion independently checkable; prefer one clear sentence over fragments.
- **Describe the system as it should be, not the changes to make.** Each spec is a coherent snapshot — it reads as "this is how the system works" rather than "change X to Y" or "no longer does Z". The implementation agent works from the diff to know what's changing.
- **No implementation details.** Specs are written at a product-owner level. Avoid function names, database fields, model names, enum values, and technical identifiers. Write "the system checks whether all parent cards have been committed" rather than naming the field that tracks commit state; write "Spec complete" rather than an all-caps status constant.
- **Stay within the spec's scope.** Each spec contains only sections that relate directly to its title and area. If content would make more sense in another spec, it belongs there — add a cross-reference (e.g. "see `scheduling/appointments.md`") rather than duplicating or misplacing it. When in doubt, ask: "would someone looking for this information expect to find it in a spec with this title?"
- **Don't specify absences.** Document what the system does, not what it doesn't do. "We don't support X" or "X is not included" is not useful — if it's not in the spec, it's not in the system. If another spec needs updating because this feature changes its behaviour, update that spec declaratively.
- **No point-in-time language.** Don't document transitions ("we used to do X, now we do Y", "this replaces Z"). Each spec is a snapshot of the desired system, not a changelog.
- **No stacking adjectives.** Don't describe behaviour with chains of near-synonyms ("seamless, invisible, frictionless"). Use one precise word or describe the concrete behaviour.
- **No exact measurements in prose.** Pixel widths, animation durations, and precise benchmarks belong in mockups or the design system, not in acceptance criteria. Describe the intent ("compact", "fast enough to feel instant") rather than the number.
- **Separate product decisions from technical/implementation notes** (distinct sections, or distinct docs) so each audience can read what's relevant.
- **Open questions must be resolved before a spec is considered done.** Record unresolved points as an explicit **Open questions** list rather than guessing. A spec with open questions is a draft — nail them down with the user before committing.
- **Australian/NZ English spelling** (colour, organisation, finalise, centre).

## When a change warrants a spec update

Specs describe product behaviour, so spec edits accompany changes that change product behaviour.

- Product-behaviour changes — new features, removed behaviour, changed flows, revised edge-case handling — require spec edits
- Bug fixes and implementation-detail changes do not require spec edits, unless the bug existed because the spec was unclear, incorrect, or missing. In that case, update the spec first so it reflects the intended behaviour, then fix the code to match
- Refactors and cleanups that leave product behaviour unchanged do not touch specs

## When to edit, fold, create, or split

Default to editing the spec that already covers the concept. A new spec file appears only when the content cannot plausibly live as a section or set of criteria inside any existing spec in the same area.

- **Fold into an existing spec** when the change is a section, criterion, or refinement on a concept the spec already covers. Most spec changes are folds
- **Create a new sibling spec** when the content is a distinct concept within an existing area but does not belong in any current file there
- **Split an existing spec** when it has grown long **and** contains one or more conceptually distinct sub-areas that could each stand alone

When splitting, the parent topic becomes a folder and the sub-topics become files within it:

- Add an `overview.md` when the folder has cross-cutting content (shared terminology, relationships between sub-specs, invariants that apply to all children), or when the folder has more than three siblings and a reader needs orientation
- Skip `overview.md` when two or three well-named siblings speak for themselves
