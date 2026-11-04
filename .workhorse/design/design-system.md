---
title: Tamanu Design System
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

## Colour palette

A cool, blue-grey system. The source of truth is the colour styles in the
[Tamanu Design System Figma library](https://www.figma.com/design/0zuHw8wmEMhEL5IJ0apjBd/Tamanu-Design-System?node-id=748-43).
In code, `TAMANU_COLORS` in `packages/ui-components/src/constants/colors.js`
(re-exported as `Colors`) mirrors those styles. Read colours from that object
(`Colors.primary`), never hardcode a hex in a component.

The MUI theme (`packages/web/app/theme/theme.jsx`) maps these tokens onto the
standard MUI palette slots (noted below), so MUI components inherit them.

The tables give each Figma style, its hex, and its `Colors` token. A style with no
token (—) has not been added to `TAMANU_COLORS` yet; add it there before using it.
All styles are at full opacity.

Secondary and tertiary hues come as a ramp: **100** is the full colour, **20** and
**10** are progressively lighter tints of it for fills and backgrounds behind that
colour.

### Primary

Blue is the interactive colour: primary actions, links, selected/active states,
focus. Spend it sparingly. It only reads as "interactive" if most of the screen
isn't blue.

| Style | Value | Token | Usage |
|---|---|---|---|
| Tamanu Blue 60 | `#326699` | `primary` | Primary buttons, active tabs, selected rows/borders, links. MUI `primary.main` |
| Tamanu Blue 30 | `#C2D2E1` | `primary30` | Disabled primary button fill/border |
| Tamanu Blue 10 | `#EBF0F5` | `primary10` | Faint primary tint for backgrounds/highlights |
| Dark Blue | `#2F4358` | `primaryDark` | Dark sidebar, tooltip backgrounds. MUI `primary.dark` |

### Secondary

The semantic colours. Each carries one meaning; use it for that meaning, not as
decoration.

| Style | Value | Token | Usage |
|---|---|---|---|
| Green-S 100 | `#47CA80` | `safe` | **Success / complete**: completed items, positive status, inpatient. MUI `success.main` |
| Green-S 20 | `#DAF4E6` | — | Success tint |
| Green-S 10 | `#EDFAF3` | — | Light background behind a success region |
| Red-S 100 | `#F76853` | `alert` | **Error**: validation failures, destructive confirmation, error toasts. MUI `error.main` |
| Red-S 20 | `#FDE1DD` | — | Error tint |
| Red-S 10 | `#FFF0EE` | `lightAlert` | Light background behind an error/alert region |
| Orange-S 100 | `#F17F16` | `orange` | **Warning / urgent**: triage, emergency/observation states |
| Orange-S 20 | `#FCE5D0` | — | Warning tint |
| Orange-S 10 | `#FEF3E8` | — | Light background behind a warning region |
| Yellow-S 100 | `#FFCC24` | `secondary` | **Attention**: secondary accent. MUI `secondary.main` |
| Yellow-S 20 | `#FFF5D3` | — | Attention tint |
| Yellow-S 10 | `#FFFAEA` | — | Light background behind an attention region |

### Tertiary

Deeper hues for distinguishing categories and statuses, such as appointment
statuses, bed states and program registry conditions. Don't reach for these for
general UI. Where a secondary colour is too light for text or icons, the tertiary
hue of the same family is its darker partner (Green-T for success, Orange-T for
warning).

| Style | Value | Token |
|---|---|---|
| Green-T 100 | `#19934E` | `green` |
| Green-T 20 | `#D1E9DC` | — |
| Green-T 10 | `#E9F5EE` | — |
| Blue-T 100 | `#1172D1` | `blue` |
| Blue-T 20 | `#CFE3F6` | — |
| Blue-T 10 | `#E8F1FB` | — |
| Purple-T 100 | `#4101C9` | `purple` |
| Purple-T 20 | `#D9CCF4` | — |
| Purple-T 10 | `#ECE6FA` | — |
| Pink-T 100 | `#D10580` | `pink` |
| Pink-T 20 | `#F6CDE6` | — |
| Pink-T 10 | `#FBE7F3` | — |
| Orange-T 100 | `#CB6100` | `darkOrange` |
| Orange-T 20 | `#F5DFCC` | — |
| Orange-T 10 | `#FAF0E6` | — |
| Yellow-T 100 | `#BD9503` | `metallicYellow` |
| Yellow-T 20 | `#F2EACD` | — |
| Yellow-T 10 | `#F9F5E6` | — |
| Brown-T 100 | `#67361B` | — |
| Brown-T 20 | `#E1D7D1` | — |
| Brown-T 10 | `#F0EBE9` | — |
| Teal-T 100 | `#125E7E` | — |
| Teal-T 20 | `#D0DFE5` | — |
| Teal-T 10 | `#E8EFF3` | — |

### Font

Four greys, darkest for primary reading down to faint. Use the ramp; don't invent
intermediate greys.

| Style | Value | Token | Usage |
|---|---|---|---|
| Super Dark 80 | `#444444` | `darkestText` | Primary text: headings, labels, body. MUI `text.primary` |
| Dark 60 | `#666666` | `darkText` | Secondary text: values, descriptions |
| Mid 40 | `#888888` | `midText` | De-emphasised: placeholders, helper text, card labels. MUI `text.tertiary` |
| Light 20 | `#B8B8B8` | `softText` | Lowest emphasis: disabled controls, faint captions, version strings |

### Misc

Surfaces, lines and hover states.

| Style | Value | Token | Usage |
|---|---|---|---|
| White | `#FFFFFF` | `white` | Cards, panels, inputs, table bodies |
| Hover 1 | `#F4F9FF` | `veryLightBlue` | Row hover tint on clickable tables. MUI `action.hover` |
| Hover 2 | `#22486D` | — | Hover colour for blue text buttons (`TextButton` hardcodes the near-identical `#23476b`) |
| Background | `#F3F5F7` | `background` | App/page background, modal body, table header, disabled fields, neutral hover. MUI `background.default` |
| Background 2 | `#F9FAFB` | `background2` | Lighter alternate panel (summary panels) |
| Default Off | `#EBEBEB` | `softOutline` | Subtle borders: section dividers, modal and card header rules |
| Box Outline | `#DEDEDE` | `outline` | Default borders: inputs, cards, table container, dividers. MUI `divider` |

### Tokens outside the Figma library

`TAMANU_COLORS` also carries `brightBlue` (`#67A6E3`), `offWhite` (`#fafafa`),
`searchTintColor` (`#d2dae3`) and `hoverGrey` (`#f3f5f7`, a duplicate of
`background`). They have no Figma style, so new work uses the nearest style above
instead.

### Rules

- **Read from `Colors`.** Never inline a hex. If a value you need isn't in the
  palette, that's a palette decision: raise it, don't fork a one-off shade.
- **Don't recolour chrome.** Borders are Box Outline / Default Off, backgrounds are
  White / Background. Resist tinting panels to "group" them; alignment and
  spacing do that job.
- **Semantic colours keep their meaning.** Don't use Red-S red for emphasis, or
  Green-S green for a non-success accent.
- **Contrast.** Body text is Super Dark 80 / Dark 60 on White or Background.
  Mid 40 is for de-emphasised secondary content, not long-form reading; Light 20
  is for disabled/faint only.

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
