---
title: Button
---
# Button

**Source:** `packages/ui-components/src/components/Button/Button.jsx` (+ `ButtonRow.jsx`)
· **Preview:** [`./button.html`](./button.html)

The action control. Built on MUI `Button` via a shared `StyledButton` base; a bare
`<Button>` is **contained / primary** (filled blue) because the theme sets those
defaults. Buttons never uppercase (14px / weight 500 / `text-transform: none`).

## When to use which — the weight ladder

Actions form a ladder, and the ladder is how the user knows what the main action
is. Use at most one primary per region.

- **`Button`** (primary, filled blue) — the main action of a screen, form, or modal.
- **`OutlinedButton`** (blue border, transparent) — secondary actions, and *Cancel*.
- **`TextButton`** (no border/fill, link-like) — tertiary, low-weight actions that
  sit inside content.
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
| `variant` / `color` / `size` | string | theme: `contained` / `primary` | MUI pass-through; `size="small"` tightens horizontal padding to 14px |

For permission-gated actions use **`ButtonWithPermissionCheck`** (props `verb`,
`noun`/`subject`) — it resolves `hasPermission` for you via CASL and shows the lock
when denied. Every action behind a permission should use it, per the project's
permission rules.

## Default styling

```
font: 500 14px/16px Roboto;  text-transform: none;
padding: 11px 18px 12px;  min-width: 100px;  border-radius: 3px;  box-shadow: none;
/* primary (contained): */   background: #326699; color: #fff;
/* primary disabled: */      background: #C2D2E1; color: #fff;
/* OutlinedButton: */        background: transparent; border: 1px solid #326699; color: #326699;
/* OutlinedButton disabled: */ border-color: #b8b8b8;
/* TextButton: */            background: none; border: none; color: #5b84ad; padding: 0;  (hover #23476b)
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
