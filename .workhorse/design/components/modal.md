---
title: Modal
---
# Modal

**Source:** `packages/ui-components/src/components/BaseModal.jsx` + web wrappers
· **Preview:** [`./modal.html`](./modal.html)

A dialog layered in four: `BaseModal` (the primitive) → `Modal` / `FormModal`
(wrappers) → `ConfirmModal` (a preset). Pick the wrapper by what's inside.

## Which to use

- **`Modal`** (`packages/web/app/components/Modal.jsx`) — a modal **without** a form.
  (In dev it warns if it detects a form inside — use `FormModal` then.)
- **`FormModal`** (`packages/web/app/components/FormModal.jsx`) — a modal that
  **contains a form**. It disables the close button while the form is submitting.
- **`ConfirmModal`** (`packages/web/app/components/ConfirmModal.jsx`) — a preset
  confirm/cancel dialog (centred text + Cancel/Confirm row). Use for "are you sure"
  and destructive confirmations.
- **`BaseModal`** — only when you need the primitive directly.

> There is no `ConfirmModalV2`.

## Key props (`BaseModal`, inherited by the wrappers)

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `open` | bool | `false` | Whether shown |
| `onClose` | func | — | Called on Escape and close-button click (**not** on backdrop click) |
| `title` | node | — | Header title |
| `width` | `xs`/`sm`/`md`/`lg`/`xl`/`false` | `sm` | Max-width preset (see below) |
| `actions` | node | — | Footer content, rendered in the footer row |
| `printable` | bool | `false` | Adds a Print button to the header |
| `isClosable` | bool | `true` | When false, disables the close button |

`ConfirmModal` adds: `onConfirm` / `onCancel`, `text` / `subText` (or
`customContent`), `confirmButtonText` / `cancelButtonText`, and `ConfirmButton`
(swap in a red button for destructive confirms).

## Sizes (`MODAL_MAX_WIDTHS`)

| Token | Max width |
|---|---|
| `xs` | 444px |
| `sm` (default) | 600px |
| `md` | 830px |
| `lg` | 1200px |
| `xl` | 1536px |

## Anatomy & styling

```
Header   padding 14px 14px 14px 32px;  border-bottom: 1px solid #ebebeb;  title + close ✕ (row-reverse)
Body     padding 18px 32px;  background #f3f5f7;  scrolls
Footer   actions row (right-aligned); omitted if no actions
```

Backdrop click does nothing — close is via the ✕ or Escape only. Transition 300ms.
`ConfirmModal` centres its text and separates the button row with a full-bleed rule.

## Do / don't

- ✅ `FormModal` for forms, `Modal` for everything else, `ConfirmModal` for confirmations.
- ✅ Use a red `ConfirmButton` for destructive confirmations; keep Cancel outlined.
- ✅ Pick the smallest `width` that fits the content (`sm` default; `md` for forms).
- ❌ Don't rely on backdrop click to dismiss — it's intentionally disabled.
- ❌ Don't put a form in a plain `Modal` (you'll get the dev warning and lose
  submit-safe close handling).
