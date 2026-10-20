---
title: FormGrid
---
# FormGrid

**Source:** `packages/ui-components/src/components/Form/FormGrid.js`
· **Preview:** [`./form-grid.html`](./form-grid.html)

The layout container for forms: a CSS grid of equal-width columns with consistent
gaps. It owns form spacing so individual fields don't have to.

## Key props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `columns` | number | `2` | Equal columns: `repeat(columns, 1fr)` |
| `nested` | bool | `false` | For a FormGrid inside a FormGrid — drops the top margin |

## Layout

- Column gap `0.7rem`, row gap `1.2rem` (`GAP_BETWEEN_FORM_ITEMS`).
- Columns are **fixed**, not auto-responsive — forms set `columns` deliberately
  (commonly 1 or 2). A field that should span the full width (e.g. a button row,
  a textarea) uses `grid-column: 1 / -1`.
- For a genuinely responsive, auto-fitting grid there is `FormGridThatFits`
  (`repeat(auto-fit, minmax(16rem, 1fr))`, gap 20px) — use it only when columns
  must reflow to width.

## Do / don't

- ✅ Wrap form fields in a `FormGrid`; use `columns={1}` for a single-column form.
- ✅ Span full-width rows (actions, notes) with `grid-column: 1 / -1`.
- ✅ Use `nested` for a sub-grid so it doesn't double up the top margin.
- ❌ Don't hand-space fields with margins — let the grid gaps do it.
