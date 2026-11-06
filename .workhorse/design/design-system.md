---
title: Tamanu design system
---
# Tamanu Design System

Tamanu is an open-source electronic medical record (EMR) used in resource-constrained
clinical settings. The desktop app is used by clinicians at nursing stations, reception
desks, and admin offices — so the system prioritises **information density,
scannability, calm medical hierarchy, and accessibility in bright or varied lighting**.

## How this is sourced

This document mirrors the designer-authored **"Tamanu Design System"** on Claude Design
(the Figma source, crystallised in `colors_and_type.css` and the preview cards). It is
the agreed design direction and the source of truth for design work in Tamanu — producing
mockups, implementing UI, and auditing both.

- Tokens live in [`colors_and_type.css`](./colors_and_type.css); read colours, spacing, radius
  and type from the CSS variables — never hardcode a value.
- Rendered previews live under [`./foundations/`](./foundations/) (colour, type, spacing, elevation)
  and [`./components/`](./components/) (one card per component).
- **The design system leads the code in places.** The shipped code (`TAMANU_COLORS` in
  `packages/ui-components/src/constants/colors.js`, `packages/web/app/theme/theme.jsx`) implements
  a subset: a single button size, no tertiary tag families, no elevation scale, a coarser
  spacing ladder, and `primaryDark #2f4358` where this system uses `bg-sidebar #2E2F33`. Treat
  this document as the target; adopt these tokens as code catches up, and flag any divergence
  rather than silently following one or the other.

## Principles

- **Clarity is safety.** Every value legible at a glance, every state unambiguous. When the
  choice is "prettier" vs "clearer", clearer wins.
- **Density, done calmly.** A lot on screen, organised — consistent grouping, alignment and
  whitespace so a dense screen still reads as orderly.
- **Every colour means something.** The palette is semantic, not decorative (blue = interactive,
  red = alert, green = success, yellow = warning). Reach for a colour because it carries that
  meaning here.

---

## Brand

### Logos

| Variant | File | Use on |
|---|---|---|
| Wordmark · light | `assets/logo-tamanu-long-blue.svg` | White / light surfaces |
| Wordmark · dark | `assets/logo-tamanu-long-white.svg` | Navy / dark surfaces |
| Icon mark · light | `assets/logo-tamanu-icon-dark.png` | White / light surfaces |
| Icon mark · dark | `assets/logo-tamanu-icon-light.png` | Navy / dark surfaces (collapsed sidebar, favicons) |

- **Wordmark** includes the "tamanu" text; used in the expanded sidebar header, login, and splash.
- **Icon mark** is the pin + medical-cross symbol; used where horizontal space is constrained
  (collapsed rail, tabs, favicons).
- Preview: [`./foundations/logos.html`](./foundations/logos.html).

---

## Colour

Every colour is a CSS custom property in `colors_and_type.css` (RGB; hex shown here for
readability). Read from the token — never hardcode a hex.

### Primary — Tamanu Blue

| Token | Hex | Use |
|---|---|---|
| `--tamanu-blue-100` | `#326699` | Primary brand blue — primary buttons, active nav, links |
| `--tamanu-blue-30` | `#C2D2E1` | 30% tint — disabled states, secondary strokes |
| `--tamanu-blue-10` | `#EBF0F5` | 10% tint — selected-row fill, hover surfaces |
| `--tamanu-dark-blue` | `#2F4358` | Deep navy — sidebar, tooltip fill, dark headers |
| `--tamanu-blue-hover` | `#22486D` | Primary-button hover |
| `--tamanu-blue-surface` | `#F4F9FF` | Secondary-button hover fill |

Preview: [`./foundations/color-primary.html`](./foundations/color-primary.html).

### Status

| Token | Hex | Use |
|---|---|---|
| `--green-100` | `#47CA80` | Success (admitted, completed, OK) |
| `--green-10` | `#EDFAF3` | Success surface |
| `--red-alert-100` | `#F76853` | Destructive, urgent alerts |
| `--red-10` | `#FFF0EE` | Danger surface |
| `--yellow-100` | `#FFCC24` | Warning, pending attention, outpatient markers |
| `--yellow-10` | `#FFFAEA` | Warning surface |

Preview: [`./foundations/color-status.html`](./foundations/color-status.html).

### Tertiary (tag / data colours)

Each family has three stops: `-100` (solid chip), `-20` (tag fill), `-10` (subtle background).

| Family | -100 | -20 | -10 |
|---|---|---|---|
| Green `--green-t-*` | `#19934E` | `#D1E9DC` | `#E9F5EE` |
| Blue `--blue-t-*` | `#1172D1` | `#CFE3F6` | `#E8F1FB` |
| Purple `--purple-t-*` | `#4101C9` | `#D9CCF4` | `#ECE6FA` |
| Pink `--pink-t-*` | `#D10580` | `#F6CDE6` | `#FBE7F3` |
| Orange `--orange-t-*` | `#CB6100` | `#F5DFCC` | `#FAF0E6` |
| Yellow `--yellow-t-*` | `#BD9503` | `#F2EACD` | `#F9F5E6` |
| Brown `--brown-t-*` | `#67361B` | `#E1D7D1` | `#F0EBE9` |
| Teal `--teal-t-*` | `#125E7E` | `#D0DFE5` | `#E8EFF3` |

Preview: [`./foundations/color-tertiary.html`](./foundations/color-tertiary.html).

### Neutrals (text, surface, chrome)

| Token | Hex | Use |
|---|---|---|
| `--font-80` | `#444444` | Primary text / headings |
| `--font-60` | `#666666` | Body text |
| `--font-40` | `#888888` | Labels, meta, secondary text |
| `--font-20` | `#B8B8B8` | Disabled text, placeholders |
| `--white` | `#FFFFFF` | Base surface |
| `--background` | `#F3F5F7` | App background |
| `--background-2` | `#F9FAFB` | Panel background |
| `--bg-sidebar` | `#2E2F33` | Sidebar background (alt navy) |
| `--box-outline` | `#DEDEDE` | Default borders |
| `--default-off` | `#EBEBEB` | Disabled fills |
| `--hover-1` | `#328DE5` | Info / hover accent blue |
| `--hover-2` | `#E8F1FB` | Very-light hover fill |

Preview: [`./foundations/color-neutrals.html`](./foundations/color-neutrals.html).

### Semantic tokens (preferred in components)

Alias the raw tokens above; prefer these in component CSS so intent is explicit.

```css
--fg-1 / --fg-2 / --fg-3 / --fg-4          /* text scale, dark → light */
--bg-app / --bg-surface / --bg-panel
--border-default / --border-strong
--link / --link-hover
--success / --danger / --warning / --info  (+ *-bg surface variants)
```

---

## Typography

### Family

**Roboto** — a humanist neo-grotesque chosen for legibility at small sizes and strong tabular
numeric alignment (critical for medical data). Self-hosted as variable TTFs; in this repo the
`@font-face` falls back to the system Roboto Tamanu already ships (`typeface-roboto`).

Only two weights are used in practice:

- **Regular (400)** — body text, field values, table cells
- **Medium (500)** — headings, button labels, nav labels, emphasis

### Scale

| Style | Size / line-height | Weight | CSS class |
|---|---|---|---|
| H1 | 24 / 32 | 500 / 400 | `.t-h1-m` / `.t-h1-r`, `h1` |
| H2 | 20 / 28 | 500 / 400 | `.t-h2-m` / `.t-h2-r`, `h2` |
| H3 | 18 / 24 | 500 / 400 | `.t-h3-m` / `.t-h3-r`, `h3` |
| H4 | 16 / 21 | 500 / 400 | `.t-h4-m` / `.t-h4-r`, `h4` |
| Body | 14 / 18 | 500 / 400 | `.t-body-m` / `.t-body-r`, `p` |
| Small | 11 / 15 | 500 / 400 | `.t-small-m` / `.t-small-r`, `small` |

Preview: [`./foundations/type-scale.html`](./foundations/type-scale.html).

---

## Spacing & radius

### Spacing scale

Base unit is 4px; the scale is **not** a strict multiple-of-4 — it also uses 2px for
ultra-tight alignments.

| Token | Value | Typical use |
|---|---|---|
| `--space-1` | 2px | Icon / text micro-nudges |
| `--space-2` | 4px | Tag padding, tight gaps |
| `--space-3` | 8px | Default internal padding, gap |
| `--space-4` | 12px | Row padding |
| `--space-5` | 16px | Card padding |
| `--space-6` | 20px | Section gap |
| `--space-7` | 24px | Large section gap |
| `--space-8` | 32px | Page section gap |
| `--space-9` | 40px | Top-level layout gap |

### Corner radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 2px | Table cell highlight, dense chips |
| `--radius-sm` | 3px | Buttons, fields, cards, most surfaces |
| `--radius-md` | 4px | Nav items, tooltips |
| `--radius-lg` | 5px | Large containers, modals |
| `--radius-pill` | 999px | Tag pills, avatars |

Preview: [`./foundations/spacing-radius.html`](./foundations/spacing-radius.html).

---

## Elevation

Four shadow tokens.

| Token | Shadow | Use |
|---|---|---|
| `--shadow-flush` | `0 1px 1px rgba(0,0,0,.05), 0 2px 4px rgba(0,0,0,.10)` | Cards, rows at rest |
| `--shadow-raised` | `0 2px 2px rgba(0,0,0,.10), 0 4px 16px rgba(0,0,0,.10)` | Dropdowns, popovers |
| `--shadow-float` | `0 8px 32px rgba(0,0,0,.15)` | Modals, dialogs |
| `--shadow-inset` | `inset 0 2px 4px rgba(0,0,0,.10), inset 0 1px 1px rgba(0,0,0,.05)` | Pressed / active inputs |

Preview: [`./foundations/elevation.html`](./foundations/elevation.html).

---

## Iconography

Tamanu Desktop uses **three distinct icon sets**, each with its own role.

- **Lucide (general UI)** — outline stroke icons for action affordances, controls, table cells,
  inline metadata. Stroke width 2, 24×24 viewport, `currentColor`. Default size 16px or 20px.
- **MUI Material Icons (clinical filled)** — filled glyphs where a solid, recognised clinical
  metaphor helps (medical services, vaccines, biotech). Filled by default; `BedOutlined` is the one
  intentional outline.
- **Brand nav icons (sidebar)** — yellow-filled circular glyphs used **only** in the primary sidebar
  to identify top-level destinations. Not for inline use.

Preview: [`./foundations/icons.html`](./foundations/icons.html) (loads the Lucide and MUI sets live).

---

## Components

The component spine, matched to the Claude Design system. Each has a rendered preview under
[`./components/`](./components/). Build with the real Tamanu components where they exist
(`@tamanu/ui-components`), and treat the specs below as the target.

### Buttons

Four sizes × four variants. Preview: [`./components/buttons.html`](./components/buttons.html).

| Size | Height | Padding (v / h) | Font |
|---|---|---|---|
| Large (`L`) | 44 | 0 / 20 | 14 / 18 · 500 |
| Medium (`M`) | 40 | 0 / 20 | 14 / 18 · 500 |
| Small (`S`) | 36 | 0 / 16 | 14 / 18 · 500 |
| XSmall (`XS`) | 32 | 0 / 12 | 11 / 15 · 500 |

- **Primary** — filled `--tamanu-blue-100`, white text. Hover → `--tamanu-blue-hover`.
- **Secondary** — 1px `--tamanu-blue-100` border, transparent fill, blue text. Hover → `--tamanu-blue-surface`.
- **Tertiary** — no border, blue text, transparent fill. Hover → `--tamanu-blue-surface`.
- **Link** — blue text, underline on hover. No padding when inline.
- **States:** default · hover · focus (2px `--tamanu-blue-30` outline, offset 1) · disabled
  (30% blue, or `--default-off` fill / `--font-20` text) · loading (spinner, label retained).

### Fields

All inputs share the "large label" pattern. Preview: [`./components/fields.html`](./components/fields.html).

- **Label** above the field — Small Medium, `--font-60`. **Required** marker `*` in `--red-alert-100`.
- **Field** — 1px `--box-outline` border, `--radius-sm`, 8/12–16 padding, Body Regular value, 36px height.
- **Helper / error** beneath — Small Regular; error text and border in `--red-alert-100`.
- Types: text, number, search (leading icon), select (trailing chevron, menu opens below),
  multi-select (chips in the input), date, date-range, time, textarea.
- States: default · focus (blue border) · filled · disabled (`--default-off`) · error · read-only.

### Selection controls

Preview: [`./components/selection-controls.html`](./components/selection-controls.html).

- **Checkbox** — 16×16, 1px border at rest; filled `--tamanu-blue-100` + white check when checked; `--radius-xs`. Partial (indeterminate) shows a dash.
- **Radio** — 16×16 circle, 1px border; filled disc `--tamanu-blue-100` when selected.
- **Toggle** — 32×18 track, 14px knob; `--default-off` off / `--tamanu-blue-100` on.

### Tags

Pill-shaped (`--radius-pill`), tertiary colour families. Preview: [`./components/tags.html`](./components/tags.html).

| Size | Height | Font |
|---|---|---|
| Large (`L`) | 28 | Body Regular 14/18 |
| XSmall (`XS`) | 24 | Small Regular 11/15 |

Fill is the tertiary `-10`/`-20`; text is the matching `-100`. An outlined variant uses a
`--tamanu-blue-100` border on white. Example: an "Outpatient" tag → `--yellow-t-10` fill, `--yellow-t-100` text.

### Toasts

Short inline confirmation. Preview: [`./components/toasts.html`](./components/toasts.html).

- `--radius-md`, flex row, padding 12/16, Body Regular.
- Statuses success / error / info (extendable to warning): background is the status `-10` surface,
  text and leading icon the matching `-100`.
- Trailing close (×) in the current colour.

### Table

Preview: [`./components/table.html`](./components/table.html) (a live template — edit columns, fields, menu and rows).

- **Search** header above the table: a field grid with an optional **Advanced** dropdown, a primary
  **Search** and a **Clear** link.
- **Header row** — `--background-2` / white fill, Body Medium, `--font-80`; sortable columns show a
  chevron.
- **Cell** — Body Regular, `--font-80`, 12/16 padding, 1px bottom border.
- **Row states**: default · hover (`--background-2` / `--tamanu-blue-10`) · selected
  (`--tamanu-blue-10` + left accent).
- **Overflow** kebab per row opens a menu; optional checkbox-selection column.
- **Footer** — Export button, rows-per-page, and pagination (chevron · "1–10 of 103" · chevron).

### Sidebar

Two states: **expanded (260px)** and **collapsed (64px)**. Preview: [`./components/sidebar.html`](./components/sidebar.html).

- **Expanded** — wordmark header; accordion sections with 24×24 brand icons, Body Medium labels, a
  caret that rotates on open; submenu rows indent to 46px, with a coloured dot for the Patients
  sub-categories (blue / green / red / yellow for All / Inpatient / Emergency / Outpatient); user
  footer with 40px avatar, name / role / facility, kebab, version and log-out.
- **Collapsed** — icon mark header; only circular brand icons, centred; a navy toggle with a yellow
  chevron on the right edge expands it; hovering an icon shows a Tooltip with the section label.

### Tooltips

Dark-blue (`--tamanu-dark-blue`) surface with a 10×10 notch rotated 45°, Roboto Small (11/15),
white text. Eight notch positions cover the common anchor combinations (top-left/top/top-right,
left/right, bottom-left/bottom/bottom-right). Preview: [`./components/tooltips.html`](./components/tooltips.html).

### Menu / dropdown

Popover surface on a trigger (kebab, chevron button): white, 1px `--box-outline`, `--radius-lg`,
`--shadow-raised`, 8px vertical padding; stacked items, Body Regular `--font-60`, hover `--hover-2`.
Preview: [`./components/menu-dropdown.html`](./components/menu-dropdown.html).

---

## Code usage

### Layout

```
colors_and_type.css          ← tokens + @font-face + typography primitives
design-system.md             ← this document
foundations/                 ← colour, type, spacing, elevation, icon, logo preview cards
components/                   ← one HTML preview card per component
designs/ · snapshots/        ← persisted mockups and captured screens
```

### Consuming tokens

Import `colors_and_type.css` once and use the CSS variables directly — never hardcode a hex.

```html
<link rel="stylesheet" href="colors_and_type.css">

<button style="
  background: var(--tamanu-blue-100);
  color: var(--white);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
  font: 500 14px/18px var(--font-family-base);
">
  Admit patient
</button>
```

### In the Tamanu app

Implement against the real components in `@tamanu/ui-components` (`packages/ui-components`) and
`packages/web/app`. Where this system is ahead of the code — the four button sizes, the tertiary tag
families, the elevation scale, the finer spacing/radius scales — it is the agreed direction: adopt
these tokens as components are built or revised, and call out any place the shipped code still
diverges rather than treating the code as canonical.
