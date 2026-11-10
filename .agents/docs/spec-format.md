---
workhorse-version: 0.7.14
---

# Spec format and information architecture

Specs are the product-level source of truth for a workspace. The format serves three audiences: product owners and testers authoring them (via interview or direct edit), developers and AI agents implementing from them, and anyone browsing them as a knowledge base.

## Information hierarchy

Specs live in `specs/` as markdown files organised into directories. The directory structure is the hierarchy: **Product > Area > Subarea > ... > Spec**, with arbitrary nesting depth.

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

Areas appear as they're needed — there's no predefined list. When drafting a new spec, the agent picks an area consistent with the existing structure. The spec explorer reads this structure from the main branch to build the navigable reference view.

## File format

A spec is a markdown file with a single-line YAML frontmatter block and a structured body. Here is a complete one:

```markdown
---
id: EXP
---

# Exporting a report

Applies to the export action on a saved report, the formats it offers, and what a user sees while an export is running.

## Starting an export

- Export is offered on a saved report and on an unsaved one that has run at least once.
- The format choices are CSV, XLSX and PDF.
- An export runs against the report's current filters, not the filters it was saved with.

> [!NOTE]
> Exporting the saved filters rather than the current ones surprised people often enough to be worth the inconsistency with the report's own title, which still reflects what was saved.

## While an export runs

- The export runs in the background, and the user can navigate away without cancelling it.
- A running export shows its progress as a proportion of rows written.
- An export that fails partway reports which stage it failed at, and the partial file is discarded.

### Large exports

- An export over the row threshold is queued rather than run immediately, and the user is told it has been queued.
- A queued export notifies the user when it completes, through the [notification settings](../account/notifications.md) they already hold.
```

The frontmatter carries exactly one field:

- `id` — a short, stable identifier for the spec, used for code-to-spec traceability (see [Spec IDs and code references](#spec-ids-and-code-references))

Nothing else goes in the frontmatter. The title comes from the H1. The area comes from the directory. The originating card isn't recorded on the spec — it's available via git history and doesn't stay tied to the spec after the card closes.

Body structure:

- **Title** — a single `#` H1 at the top, human-readable (e.g. "Patient allergies")
- **Scope sentence** — one sentence directly below the title, no heading, naming what the spec's requirements apply to
- **Sections** — `##` headings group related criteria; `###` for sub-sections, with no level skipped
- **Acceptance criteria** — plain bullets
- **Notes** — `> [!NOTE]` callouts carrying rationale, beneath the bullets of the section they explain

### The scope sentence

One sentence, in whatever phrasing reads best. A spec opens by saying what it covers, then goes straight to criteria — there is no summary paragraph.

The trap, when an existing spec opens with a longer summary, is that compressing it can silently drop content. Such a paragraph often carries scope that no criterion states — which actors a screen serves, which fields a flow records, which of several entry points are in play. Compressing it to a restatement of the title loses that, and nothing in the diff shows it went. Carry such detail into the sentence itself, or make it a criterion.

### Criteria

Plain bullets, in the declarative voice. No RFC 2119 keywords — MUST/SHOULD/MAY on every bullet reads as repetitive at length and costs words rather than saving them, so requirement strength is not marked.

One idea per bullet, except where a sentence reads naturally whole; don't split a sentence for the rule's sake.

### Note callouts

Rationale goes in a `> [!NOTE]` callout beneath the bullets of its section, rather than woven into a criterion. This keeps the criteria themselves readable as a list of facts.

- A callout carries a **reason**. If a note only restates the bullet above it, the content was scope and belongs in the criterion.
- Callouts are not hard-wrapped: one source line per paragraph, as for bullets. Wrapping to 80 columns turns a one-line paragraph into five.

### Tables

A fixed set of things sharing a shape goes in a table, when **each item carries two or more attributes** and **every column can be filled from what is known**.

Both qualifiers matter. A one-attribute list stays bullets: a header and separator row cost five or six lines to replace one or two. A column you can fill for only some items is worse, because it invites inventing the missing values — if three exceptions have a stated reason for only one of them, they stay bullets.

### Borrowed terms

A spec that leans on a term borrowed from outside the product — an HTTP header, a standard, a third-party concept — carries a `## Borrowed terms` section defining it and linking to its authoritative definition:

```markdown
## Borrowed terms

- [`Idempotency-Key`](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/): HTTP request header by which a client names one logical operation, so a server can recognise a retry of it.
```

This is conditional, and most specs warrant none. A term the product itself defines is not borrowed.

### Cross-references

A reference to another spec is an inline link woven into the criterion it bears on, not a trailing parenthetical:

```markdown
- A queued export notifies the user when it completes, through the [notification settings](../account/notifications.md) they already hold.
```

Not:

```markdown
- A queued export notifies the user when it completes (see `account/notifications.md`).
```

## Spec IDs and code references

The `id` in frontmatter is a short, stable handle. It lets code reference the spec it implements through inline comments, and survives the spec being renamed or moved.

- IDs are 2–6 character alphanumeric codes, uppercase, chosen when the spec is first created (e.g. `ALG`, `AUTH`, `LAB1`). Use something memorable rather than sequential numbering
- IDs are unique within a workspace. Workhorse checks for collisions on creation
- Once assigned, an ID never changes. The filename or location can change freely — code references keep working
- Code references an implementing spec with an inline comment of the form `// spec: ALG`. For a specific section within the spec, append a kebab-case slug of the heading text: `// spec: ALG#conflict-handling`
- A single piece of code can reference multiple specs with multiple comments — don't try to combine them

Code references are advisory, not load-bearing. They help a reader jump from an implementation detail to the product rule it answers to. Missing references are not a bug.

## Section numbering

Sections are numbered when a spec is displayed — in the spec editor, the spec explorer, and the spec diff. The number is drawn at display time and is **not** written into the markdown, so a section can be inserted, removed or reordered without touching every heading after it, and no number appears in the git diff.

Never write a literal number into a heading. `## 3. While an export runs` carries exactly the renumbering cost the display-time number exists to avoid.

Because the number isn't in the file, it can't be text-searched — "see section 3" finds nothing. Reference a spec by its ID and a section by its heading link instead.

## Writing conventions

- **Describe the system as it should be, not the changes to make.** Each spec is a coherent snapshot — it reads as "this is how the system works" rather than "change X to Y" or "no longer does Z". No references to "current behaviour", "remains unchanged", "now does", or "rather than the old way". The implementation agent works from the diff to know what's changing.
- **Acceptance criteria are facts about behaviour, not instructions to a developer.**
- **Grade implementation detail by whether it constrains behaviour that must be preserved.** Product-owner-level language is the default: write "the system checks whether all parent cards have been committed" rather than naming the field that tracks commit state, and "Spec complete" rather than an all-caps status constant. But a technical choice belongs in the spec when the choice *is* the requirement — when a reimplementation should be held to it rather than free to pick its own approach. The decision test is: **"Would someone reimplementing this from scratch need to be constrained back to this technical choice?"** If yes, name the detail; the spec is where that constraint is recorded. If no, describe the behaviour and let the implementation choose its tools.
  - **Keep the detail** when it is load-bearing. A sync engine that heals divergence by replaying from a known-good checkpoint must preserve that mechanism, so the spec names it — a different healing strategy would be a different product. Backend and platform specs often carry this kind of detail: data-integrity rules, concurrency and ordering guarantees, wire and storage formats, migration and healing strategies.
  - **Leave it out** when the detail is one acceptable way among several to build the same behaviour. Choosing React hooks to manage state in a frontend workflow is an implementation choice — the user-visible behaviour is the requirement, so specify that and let the build pick its tools. Product-facing, CRUD, and frontend specs stay behavioural.
  - File paths inside `specs/` are always acceptable because they're part of the product's information architecture.
- **Stay within the spec's scope.** Each spec contains only sections that relate directly to its title and area. If content would make more sense in another spec, it belongs there — add a cross-reference rather than duplicating or misplacing it. When in doubt, ask: "would someone looking for this information expect to find it in a spec with this title?"
- **Don't specify absences.** Document what the system does, not what it doesn't do. "We don't support X" or "X is not included" is not useful — if it's not in the spec, it's not in the system. If another spec needs updating because this feature changes its behaviour, update that spec declaratively.
- **No point-in-time language.** Don't document transitions ("we used to do X, now we do Y", "this replaces Z"). Each spec is a snapshot of the desired system, not a changelog.
- **No stacking adjectives.** Don't describe behaviour with chains of near-synonyms ("seamless, invisible, frictionless"). Use one precise word or describe the concrete behaviour.
- **No exact measurements in prose.** Pixel widths, animation durations, and precise benchmarks belong in mockups or the design system, not in acceptance criteria. Describe the intent ("compact", "fast enough to feel instant") rather than the number.
- **Open questions must be resolved before a spec is considered done.** A spec with open questions is a draft. Nail them down with the user before committing.
- **Australian/NZ English spelling** (colour, organisation, finalise).

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
