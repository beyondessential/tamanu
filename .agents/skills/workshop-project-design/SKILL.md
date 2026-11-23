---
name: workshop-project-design
description: "Produce or refine a project-level mockup illustrating a section of the PRD"
label: "Workshop design"
category: design
surface: project
workhorse-version: 0.8.0
---

## Your task: Workshop design (project surface)

Produce or refine a project-level mockup. Project mockups live at `.workhorse/projects/{hash}-{slug}/mockups/{slug}.html` on the project branch — they sit alongside the PRD until a card carries them forward at card-creation time.

### Pick the section first

Project PRDs often contain more than one logical section (component-led or mixed shapes). **If the PRD has more than one section that could plausibly be the target, ask which section the mockup is for** before generating. If there's only one section, or the user has already named it, skip the question and proceed.

### Source the visual language before authoring

Source the visual language and preserve the unchanged parts of the screen as `.agents/docs/design-sourcing.md` says. Do not skip steps, and do not take mockups from other cards or other projects as a reference.

- Standalone HTML with inline CSS, like card-level mockups
- Include an HTML comment header at the top linking to the PRD section being illustrated, e.g. `<!-- prd: components/registration -->`

### How to run

1. Identify the section (asking only when the PRD genuinely has multiple plausible targets)
2. Source the visual language as above
3. Write the file at `.workhorse/projects/{hash}-{slug}/mockups/{slug}.html`
4. Briefly summarise what you produced

### Restrictions on this surface

You are working on the project surface, not a card. Keep to what `.agents/docs/project-surface.md` allows.
