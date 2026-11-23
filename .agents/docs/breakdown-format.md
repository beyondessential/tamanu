---
workhorse-version: 0.8.0
---

# Breakdown format

A breakdown lists the cards a card or a project splits into: an H1 title, an optional intro, then one entry per card. Each entry is a `## ` heading, which becomes the new card's title, and the text beneath it, which becomes its description. The breakdown editor turns entries into cards.

```markdown
---
base: default
---

# Card breakdown

Optional intro, which is not an entry.

## Filter the patient list by allergy
<!-- mockups: patient-list-filter -->

Adds a filter to the patient list that narrows it by allergy.
It depends on the allergy labels the registration entry adds.

## Capture allergies at registration

A new section of the registration form, using the existing label picker.
```

## What the editor relies on

Keep to these always. The editor reads the file by them, and an entry that breaks one turns into the wrong cards.

- **A line starting `## ` starts the next entry**, wherever it is, even inside a fenced code block. Never write one inside a description, not even in a code sample.
- **The first `<!-- mockups: … -->` line under a heading is the entry's mockups selection**: a comma-separated list of mockup slugs that travel with the new card. It sits on a line of its own, and only the first one in an entry counts.
- **A ` · CODE` suffix on a heading marks the card that entry is tracked by.** Create cards skips a stamped entry, and the editor shows the card's status beside it. The editor stamps the cards it creates. Stamp an entry yourself to track a card that already exists, one made separately or through `create_card`, when the user wants it tracked in the breakdown, or add an entry for it stamped from the start. Check the code with `get_card` first, and write it exactly as the editor would: a space, `·`, a space and the code at the end of the heading. Leave a stamped entry's stamp alone unless the user asks to change it.
- **The frontmatter's `base:` line is the breakdown's base setting**, on a card breakdown only. `base: default` bases the new cards on the repository's default branch; no `base:` line bases them on the card that owns the breakdown. When you write one, the frontmatter is the first thing in the file. Leave any other frontmatter line as it is.
- Text above the first `## ` heading is the title and intro, never an entry.

## House style

These rules have reasons, and you may depart from one where an entry reads better another way.

- **Short paragraphs on scope, boundaries and dependencies.** The description is the new card's description, which a person reads to know what the card is for and where it stops.
- **Plain bullets where they read better** than a paragraph, such as a short list of the surfaces a card covers.
- **No checklists, sub-headings or build steps.** How a card gets built belongs in that card's own plan, written once it exists, so detail here is written twice or goes stale.
- **A concise, action-oriented heading** with no trailing full stop, since it becomes a card title.
- **Do not restate what the new cards inherit**: the project, and the base the breakdown sets.
