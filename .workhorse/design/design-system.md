---
title: Tamanu design system
---
# Tamanu Design System

Tamanu is an electronic medical record for hospitals and clinics in low-resource,
often low-connectivity settings. The interface is a clinical workhorse: staff use
it all day, under load, to make decisions about real patients. It should be dense,
legible, calm, and unsurprising. The patient record is the product; the chrome
around it should recede.

This is the lineage to aim for — the quiet competence of a well-built line-of-business
tool, not the flourish of a consumer app. No decoration that doesn't carry
information. No novelty for its own sake.

## Design philosophy

**Clarity is safety.** A misread dose, a status glanced at wrong, a label that
could mean two things — in a clinical record these are not cosmetic faults. Every
value must be legible at a glance and every state unambiguous. When a choice is
between "prettier" and "clearer", clearer wins every time.

**Density, done calmly.** Clinicians need a lot on screen at once — a table of
results, a card of patient details, a form with twenty fields. The answer is not
to hide information behind clicks, but to organise it: consistent grouping,
alignment, and whitespace so a dense screen still reads as orderly rather than
noisy. Compact where it must be, never cramped.

**The data is the interface.** Colour, weight, and chrome are spent on the
clinical content, not on the frame around it. The accent blue is an accent — it
marks what is interactive or selected, and little else. A screen where everything
is coloured or boxed is a screen where nothing stands out.

**Every colour means something.** The palette is semantic, not decorative. Blue is
interactive (primary actions, links, selection). Red is error. Green is safe /
complete. Orange is warning / urgent. Don't reach for a colour because a region
"needs" one; reach for it because it carries that meaning here. See
[Colour palette](#colour-palette).

**Boring is a feature.** Prefer the conventional pattern over the clever one. A
form is a form, a table is a table, a modal confirms before it destroys. Staff are
trained once and then trusted to move fast; surprise is a tax on that. New
interaction patterns need to earn their place against the cost of re-teaching them.

**Consistency across surfaces.** The same concept should look the same in the
facility server, the central admin panel, and (as far as the platform allows)
mobile. A status chip, a label/value pair, a primary button — one treatment each,
reused, not re-invented per screen.

**Everything visible is translatable.** Tamanu is deployed in many countries and
languages. All user-facing copy — labels, buttons, placeholders, toasts, table
headings — goes through `TranslatedText` / `TranslatedEnum` / `TranslatedReferenceData`.
Hardcoded English is a defect, not a detail.

## How to use this document

This is the source of truth for design work in Tamanu — for producing mockups,
for implementing UI, and for auditing both. It is grounded in the shipped code
(`packages/ui-components` and `packages/web`), with file paths cited so you can
confirm against the implementation.

- When this document disagrees with something shipped elsewhere in the codebase,
  **this document represents the agreed direction** — but say so, rather than
  silently following one or the other.
- The values here are extracted from code, not from Figma. A programmatic
  cross-check against the Figma *Tamanu Design System* file was only partially
  possible this pass (the file exposed a cover page and a single confirmed token,
  `Background 2 = #F9FAFB`, which matches the code). Treat the code as
  authoritative; a fuller Figma reconciliation is follow-up work.
- **Component docs and previews live in [`./components/`](./components/)** — each
  component has a markdown doc and a rendered HTML preview.

---

## Colour palette

A cool, blue-grey system. The single source of truth is `TAMANU_COLORS` in
`packages/ui-components/src/constants/colors.js`, re-exported as `Colors`. Read
colours from that object (`Colors.primary`) — never hardcode a hex in a component.

The MUI theme (`packages/web/app/theme/theme.jsx`) maps these tokens onto the
standard MUI palette slots (noted below), so MUI components inherit them.

### Brand / interactive

Blue is the interactive colour: primary actions, links, selected/active states,
focus. Spend it sparingly — it only reads as "interactive" if most of the screen
isn't blue.

| Token | Value | Usage |
|---|---|---|
| `primary` | `#326699` | Primary buttons, active tabs, selected rows/borders, links. MUI `primary.main` |
| `primaryDark` | `#2f4358` | Dark sidebar, tooltip backgrounds. MUI `primary.dark` |
| `primary30` | `#C2D2E1` | Disabled primary button fill/border (30% presence) |
| `primary10` | `#EBF0F5` | Faint primary tint for backgrounds/highlights |
| `blue` | `#1172D1` | Secondary link/info blue (distinct from brand `primary`) |
| `brightBlue` | `#67A6E3` | Lighter accent blue |
| `veryLightBlue` | `#F4F9FF` | Row hover tint on clickable tables. MUI `action.hover` |

### Text ramp

Four weights of grey, darkest for primary reading down to faint. Use the ramp;
don't invent intermediate greys.

| Token | Value | Usage |
|---|---|---|
| `darkestText` | `#444444` | Primary text — headings, labels, body. MUI `text.primary` |
| `darkText` | `#666666` | Secondary text — values, descriptions |
| `midText` | `#888888` | Tertiary / de-emphasised — placeholders, helper text, disabled, card labels. MUI `text.tertiary` |
| `softText` | `#b8b8b8` | Lowest emphasis — disabled controls, faint captions, version strings |

### Semantic

Each carries one meaning. Use them for that meaning, not as decoration.

| Token | Value | Meaning |
|---|---|---|
| `alert` | `#f76853` | **Error** — validation failures, destructive confirmation, error toasts. MUI `error.main` |
| `lightAlert` | `#fff0ee` | Light tint background behind an error/alert region |
| `safe` | `#47ca80` | **Success / complete** — completed items, positive status, inpatient. MUI `success.main` |
| `green` | `#19934E` | Deeper success green (text/icons where `safe` is too light) |
| `orange` | `#f17f16` | **Warning / urgent** — triage, emergency/observation states |
| `darkOrange` | `#CB6100` | Darker warning — in-progress, no-show |
| `secondary` | `#ffcc24` | Attention yellow (secondary accent). MUI `secondary.main` |

### Surfaces & lines

| Token | Value | Usage |
|---|---|---|
| `white` | `#ffffff` | Cards, panels, inputs, table bodies |
| `offWhite` | `#fafafa` | Subtle off-white surface |
| `background` | `#f3f5f7` | App/page background, modal body, table header, disabled fields. MUI `background.default` |
| `background2` | `#f9fafb` | Lighter alternate panel (summary panels). Confirmed against Figma `Background 2` |
| `hoverGrey` | `#f3f5f7` | Neutral hover fill (same hex as `background`) |
| `outline` | `#dedede` | Default borders — inputs, cards, table container, dividers. MUI `divider` |
| `softOutline` | `#ebebeb` | Subtle borders — section dividers, modal header rule, card header rule |
| `searchTintColor` | `#d2dae3` | Search field tint |

### Occasional

Reserved, narrow-use hues. Don't reach for these for general UI.

| Token | Value | Usage |
|---|---|---|
| `pink` | `#D10580` | Category/identity accent |
| `purple` | `#4101C9` | Category/identity accent |
| `metallicYellow` | `#BD9503` | Category/identity accent |

### Rules

- **Read from `Colors`.** Never inline a hex. If a value you need isn't in the
  palette, that's a palette decision — raise it, don't fork a one-off shade.
- **Don't recolour chrome.** Borders are `outline`/`softOutline`, backgrounds are
  `white`/`background`. Resist tinting panels to "group" them; alignment and
  spacing do that job.
- **Semantic colours keep their meaning.** Don't use `alert` red for emphasis, or
  `safe` green for a non-success accent.
- **Contrast.** Body text is `darkestText`/`darkText` on white or `background`.
  `midText` is for de-emphasised secondary content, not long-form reading;
  `softText` is for disabled/faint only.

## Typography

### Font

**Roboto** is the UI typeface, bundled with the app (via the `typeface-roboto`
package, imported once in `App.jsx`) — not loaded from a CDN. The CSS fallback
stack is `'Roboto', 'Helvetica', 'Arial', sans-serif`. **Fira Code** is loaded as
a monospace face **only** for the SQL/JSON editor — it is not a general UI font.

There is no monospace treatment for IDs or codes in Tamanu (unlike some design
systems); identifiers render in Roboto like everything else.

### Type scale

Tamanu's type scale is **not** expressed through MUI typography variants — the
theme only sets `fontFamily: 'Roboto'` and leaves the MUI variant scale at its
defaults. The real scale is eight styled components in
`packages/web/app/components/Typography.js`. Use these components for text rather
than raw MUI `Typography` or ad-hoc `font-size`.

| Component | Size | Line-height | Weight | Element |
|---|---|---|---|---|
| `Heading1` | 24px | 32px | 500 | `h1` |
| `Heading2` | 20px | 28px | 500 | `h2` |
| `Heading3` | 18px | 24px | 500 | `h3` |
| `Heading4` | 16px | 21px | 500 | `h4` |
| `Heading5` | 14px | 18px | 500 | `h5` |
| `LargeBodyText` | 16px | 21px | 400 | `div` |
| `BodyText` | 14px | 18px | 400 | `div` |
| `SmallBodyText` | 11px | 15px | 400 | `div` |

`BodyText` (14px) is the default body size — it matches the base control text
(inputs, buttons, table cells are all 14px). `SmallBodyText` (11px) is for
helper text, captions, and metadata. Headings step 24 → 20 → 18 → 16 → 14, all at
weight 500 (medium); there is no 700/bold heading weight in the scale.

### The `color` prop gotcha (important)

The shared base of these components maps **only** `color="textTertiary"` →
`midText` (`#888`). **Any other `color` value — including `textPrimary` and
`textSecondary` — is a silent no-op**: the component applies no colour and inherits
the ambient text colour (effectively `darkestText` `#444`).

```jsx
<BodyText color="textSecondary">…</BodyText>   // ❌ no-op — renders #444, not #666
<BodyText color={Colors.darkText}>…</BodyText> // ✅ explicit token
```

To set anything other than the tertiary grey, pass an explicit `Colors.*` value.
Don't trust `textPrimary`/`textSecondary` on these components.

### Other type set in the theme

| Context | Treatment | Source |
|---|---|---|
| Form helper text | 11px, line-height 1.4, `midText` | `MuiFormHelperText` |
| Menu item | 11px, letter-spacing 0.02em | `MuiMenuItem` |
| Tabs | `text-transform: none`, min-height 48px | `MuiTab` |
| Button | 14px, weight 500, `text-transform: none` | `StyledButton` |

Note: buttons and tabs **never uppercase** their text (MUI's default is overridden).

## Spacing

Base unit: **8px** (`MUI_SPACING_UNIT` in `packages/web/app/constants/styles.js`).
Note that `theme.spacing()` is **not** used — spacing is applied by importing the
constant and multiplying inline (`spacing * 2` → 16px, `spacing / 2` → 4px).

The canonical ladder derived from the unit:

| Value | Multiple | Typical usage |
|---|---|---|
| 4px | ½ | Tight inline gaps (label-to-ornament, icon-to-text) |
| 8px | 1× | Small gaps between elements |
| 16px | 2× | Standard block padding, section gaps |
| 24px | 3× | Page/layout horizontal padding, large section gaps |

A fair amount of component CSS also uses off-grid literals (5, 10, 12, 20, 30px) —
these exist, but **new work should prefer the 4 / 8 / 16 / 24 ladder** rather than
adding more off-grid values.

Form layout spacing is owned by `FormGrid` (column gap `0.7rem`, row gap `1.2rem`) —
see [the FormGrid doc](./components/form-grid.md); don't hand-space fields.

## Border radius

The base UI radius is **3px** (`theme.shape.borderRadius`), inherited by buttons,
inputs, and most containers. Larger surfaces round a little more; chips, tags, and
status pills are fully rounded.

| Radius | Usage |
|---|---|
| `3px` | **Base** — buttons, inputs, autocomplete, generic containers (`theme.shape.borderRadius`) |
| `2px` | Tight inputs (date field, settings rows) |
| `4px–5px` | Feature cards, panels, invoice/medication cards (`InfoCard` uses 5px) |
| `10px` | Larger rounded cards and popovers |
| `16px` | Select / dropdown menu containers |
| `20px` / `25px` | Chips & tags (`FormFieldTag` 20px, `TableCellTag` 25px) |
| `50px` / `100px` / `999px` / `calc(infinity * 1px)` | Fully-rounded pills — status pills, toggles, badges |
| `20%` / `50%` | Icon buttons (`20%`), circular avatars/spinners (`50%`) |

Rule of thumb: **square-ish (3px)** for controls and containers, **fully-round**
for status pills and chips. Avoid introducing new mid-range values (6/8/9px appear
occasionally but aren't a deliberate step).
