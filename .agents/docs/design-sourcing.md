---
workhorse-version: 0.8.0
---

# Design sourcing

This applies to every UI artefact you produce: a mockup from a skill, one you make unasked while interviewing, workshopping or drafting, and UI you change while implementing. It holds for card mockups and project mockups alike.

## Where the visual language comes from

Work through these in order, and do not skip one that applies.

1. **Start from a snapshot where one covers the screen.** The design directory's `snapshots/` folder (`.workhorse/design/snapshots/`) holds faithful captures of the product's screens, with its real images and fonts. Start the mockup from a copy of the snapshot, then change only what the work changes, rather than rebuilding the screen from the code. Copy it with the `start_mockup_from_snapshot` tool where you have it; otherwise copy the file into the mockups folder yourself and re-point its `../assets/` addresses to resolve from where the mockup sits. Read the code as well, for how the screen behaves, since a snapshot records how it looks and not what it does.
2. **Otherwise, read the implementation of the section being mocked or changed** in the target repository. The shipped code is how the screen looks today: its components, layout, spacing and copy. Start from it, so the result is grounded in what exists rather than imagined.
3. **Read implementations of similar components** elsewhere in the repository, for the patterns any new element should follow. Where the design directory has a `components/` folder, take curated parts from it.
4. **Cross-check against the design directory** (`.workhorse/design/`): the design system, component docs and philosophy notes. The design library can be newer than the code, so where the two disagree, the design library wins. It is the agreed direction.

Do not take mockups from other cards under `.workhorse/design/mockups/` as a reference unless the user asks. They are point-in-time artefacts for their own card, not canonical components. Earlier mockups on the same card can carry through.

## Preserving unchanged aspects

A mockup or UI change usually reshapes only part of a screen. Everything around it carries through from what is shipped. Getting this wrong is what makes a mockup look off or regressed even when the new part looks fine.

- **Author fresh HTML and CSS only for the feature or tweak being developed.** Do not restyle, re-lay out or reimagine regions the work is not changing, even where you think you could improve them.
- **Keep unchanged regions visually faithful to the baseline**: the snapshot where one covers the screen, otherwise the current implementation. Same layout, components, copy, spacing and styling. The composed result has to look the same; copying the markup literally is not required.
- **Keep stale styling from other cards' mockups out** of unchanged regions. The sources above are the only reference for them.
- **For the HTML and CSS you do author, follow the same order**: the design system first, then the patterns of similar components, and fresh styling only where neither covers it.
