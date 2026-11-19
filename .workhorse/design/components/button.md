---
title: Button
---
# Button

**Source:** `packages/ui-components/src/components/Button/Button.jsx` (+ `ButtonRow.jsx`)
· **Preview:** [`./button.html`](./button.html)

The action control. Built on MUI `Button` via a shared `StyledButton` base; a bare
`<Button>` is **contained / primary** (filled blue) because the theme sets those
defaults. Buttons never uppercase.

## When to use which — the weight ladder

Actions form a ladder, and the ladder is how the user knows what the main action
is. Use at most one primary per region.

- **`Button`** (primary, filled blue) — the main action of a screen, form, or modal.
- **`OutlinedButton`** (blue border, transparent) — secondary actions, and *Cancel*.
- **`TextButton`** (link button) — tertiary, low-weight actions that sit inside
  content. See [Link buttons](#link-buttons).
- **`GreyOutlinedButton`** — neutral secondary where blue would over-signal.
- **`RedOutlinedButton`** / **`DeleteButton`** — destructive actions (outlined =
  secondary-destructive; `DeleteButton` = filled red primary-destructive).

## Key props

Custom props live on `Button`; everything else passes through to MUI.

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `isSubmitting` | bool | `false` | Disables the button and swaps the label for a spinner |
| `disabled` | bool | `false` | Disables (also disabled while `isSubmitting`) |
| `hasPermission` | bool | `true` | When false, disables and shows a lock icon |
| `loadingColor` | string | `Colors.white` | Spinner colour |
| `variant` / `color` / `size` | string | theme: `contained` / `primary` | MUI pass-through. See [Where the code differs](#where-the-code-differs) for how `size` maps today |

For permission-gated actions use **`ButtonWithPermissionCheck`** (props `verb`,
`noun`/`subject`) — it resolves `hasPermission` for you via CASL and shows the lock
when denied. Every action behind a permission should use it, per the project's
permission rules.

## Sizes

Four sizes, each with the same appearance variants. Medium is the default.

| Size | Height | Padding (vertical / horizontal) | Icon | Icon–label gap | Font size / line height |
|---|---|---|---|---|---|
| Large | 44px | 8px / 20px | 20 × 20px | 8px | 14px / 18px |
| Medium | 40px | 8px / 20px | 20 × 20px | 8px | 14px / 18px |
| Small | 36px | 8px / 16px | 18 × 18px | 8px | 14px / 18px |
| XSmall | 32px | 8px / 12px | 16 × 16px | 4px | 11px / 15px |

Heights are fixed; the padding sets the horizontal inset and the minimum vertical
inset. Width follows the label and icon.

## Shared styling

```
font: 500 Roboto (Medium);  letter-spacing: 0;  text-transform: none;
border-radius: 3px;  box-shadow: none;
layout: horizontal, icon then label, centred;
secondary border: 1px, inside the button's height (box-sizing: border-box);
```

## Colours and states

The same colours apply at every size.

| Appearance | Background | Label and icon | Border |
|---|---|---|---|
| Primary | Tamanu Blue 60 `#326699` | White `#FFFFFF` | None |
| Primary hover | Hover 2 `#22486D` | White `#FFFFFF` | None |
| Primary disabled | Tamanu Blue 30 `#C2D2E1` | White `#FFFFFF` | None |
| Secondary | Transparent | Tamanu Blue 60 `#326699` | Tamanu Blue 60 `#326699` |
| Secondary hover | Hover 1 `#F4F9FF` | Tamanu Blue 60 `#326699` | Tamanu Blue 60 `#326699` |
| Secondary disabled | Transparent | Tamanu Blue 30 `#C2D2E1` | Tamanu Blue 30 `#C2D2E1` |

Primary is `Button`; secondary is `OutlinedButton`. The Figma file names the
disabled variants "Deactive".

## Link buttons

Text-only buttons with an optional leading icon. Two sizes, each with a primary and
secondary style.

| Size | Font size / line height | Icon | Icon–label gap |
|---|---|---|---|
| Large | 14px / 18px | 12 × 12px | 4px |
| XSmall | 11px / 15px | 12 × 12px | 4px |

```
background: transparent;  border: none;  border-radius: 0;  box-shadow: none;
padding: 0;  letter-spacing: 0;  sized to content;  icon then label, centred;
```

| Style | Label and icon | Weight | Underline |
|---|---|---|---|
| Primary | Tamanu Blue 60 `#326699` | Medium 500 | No |
| Secondary | Super Dark 80 `#444444` | Regular 400 | Yes |
| Hover (both styles) | Tamanu Blue 60 `#326699` | Medium 500 | Yes |

Line height holds in every state, so a link keeps its height on hover. The Figma
file has no disabled, pressed or focus variants for links.

## Where the code differs

The implementation predates these sizes. Until it is brought in line:

- `StyledButton` uses `padding: 11px 18px 12px`, `line-height: 16px` and
  `min-width: 100px` rather than a fixed height, which comes out close to Medium.
- `LargeButton` (15px / 18px, `padding: 12px 25px`) is the nearest to Large.
  `size="small"` only narrows the horizontal padding to 14px and keeps the Medium
  height. There is no XSmall.
- Child icons are `19.5px` wide with a `10px` gap.
- Primary hover falls back to MUI's `primary.dark` (Dark Blue `#2f4358`), and
  secondary hover to MUI's translucent primary tint, rather than Hover 2 and Hover 1.
- `OutlinedButton` overrides its disabled border to Light 20 `#b8b8b8`, so it
  doesn't match its Tamanu Blue 30 label.
- `TextButton` is the nearest to the primary link, but uses `#5b84ad` at 16px,
  turns `#23476b` on hover without an underline, and keeps MUI's 8px icon gap.
  There is no secondary link style or XSmall link.
- `BackButton` is a `TextButton` in Tamanu Blue 60 at 12px with a 20px chevron,
  between the Large and XSmall link sizes.

## Other variants

These sit outside the Figma button set:

```
/* GreyOutlinedButton: */  border: 1px solid #dedede; color: text.secondary;
/* RedOutlinedButton: */   MUI outlined, color="error" (Red-S 100 #f76853)
/* DeleteButton: */        background: MUI red[600]; hover red[800]; color: #fff;
```

## Layout helpers

Don't hand-lay button rows. Use the helpers in `ButtonRow.jsx`, which handle
right-alignment, spacing, and spanning a form:

- **`FormSubmitCancelRow`** — the standard form footer: Cancel (outlined) + Submit
  (primary), wired to form submission state.
- **`ConfirmCancelRow`** — confirm/cancel pair outside a form.
- **`ButtonRow`** — generic right-aligned row (`alignment="left"` to left-align).

## Do / don't

- ✅ One primary action per region; everything else outlined or text.
- ✅ Use `isSubmitting` for async actions so the button self-disables and shows progress.
- ✅ Use `ButtonWithPermissionCheck` for permission-gated actions.
- ❌ Don't uppercase button labels or add custom shadows.
- ❌ Don't build raw MUI `<Button>`s — you'll miss the theme defaults, spinner, and lock.
- ❌ Don't put two primary buttons side by side.
