---
title: Table
---
# Table

**Source:** `packages/web/app/components/Table/` (`Table.jsx`, `DataFetchingTable.jsx`)
· **Preview:** [`./table.html`](./table.html)

The list/grid. Two entry points: **`Table`** (you own the data and paging state)
and **`DataFetchingTable`** (give it an `endpoint` and it fetches, sorts, and pages
itself). Most list views use `DataFetchingTable`.

## Columns API

Columns are an array of descriptors:

| Field | Purpose |
|---|---|
| `key` | **Required.** Column id, data path (`get(row, key)`), sort key, React key |
| `title` | Column heading (a `TranslatedText`); falls back to `key` |
| `accessor` | Function `(row) => node` for a custom cell (receives row + `rowIndex`) |
| `CellComponent` | Custom cell renderer `{ value, data }` |
| `sortable` | Default **`true`**; set `false` to disable the sort control |
| `numeric` | Right-aligns header and cell |
| `maxWidth` | Truncates with ellipsis |
| `cellColor` | Cell background (value or `(row) => colour`) |

## Key props

**`Table`:** `data`, `columns`, `isLoading`, `errorMessage`, `noDataMessage`
(default "No data found"), `onRowClick(row)`, `rowStyle(row)`, `order`/`orderBy`/
`onChangeOrderBy`, `page`/`count`/`rowsPerPage`/`onChangePage` (set `page={null}`
to hide the paginator), `allowExport` (default true), `elevated` (default true).

**`DataFetchingTable`** adds: `endpoint` (required), `fetchOptions` (query params;
changing them resets to page 0), `transformRow`, `initialSort`, `refreshCount`,
`onDataFetched`, `disablePagination`, `lazyLoading`, `autoRefresh`, and
permission support (`DataFetchingTableWithPermissionCheck`).

## Default styling

```
container  border: 1px solid #dedede; border-radius: 5px; background: #fff; (shadow when elevated)
header     background #f3f5f7; white-space: nowrap
body cell  padding 20px 15px; font-size 14px; line-height 1.3; bottom border #dedede
row (clickable)  cursor: pointer; hover background #F4F9FF
empty/status cell  padding 60px; centred
paginator  page buttons 1px #dedede; selected page = #326699 bg, white text
```

## Dense variant

`denseTableStyle` (in `packages/web/app/constants/styles.js`) passed via
`containerStyle` / `cellStyle` / `headStyle` / `statusCellStyle` makes a borderless,
tighter table (body padding 4px, muted non-bold header, left-flush cells). Use it
for compact, embedded tables (e.g. inside a card or panel).

## States

Every table must handle: **loading** (`isLoading`), **error** (`errorMessage`),
and **empty** (`noDataMessage`) — don't leave a blank table for any of them.

## Do / don't

- ✅ Use `DataFetchingTable` with an `endpoint` for server-paged lists.
- ✅ Translate every column `title`; put reference-data values through `TranslatedReferenceData`.
- ✅ Provide loading / error / empty messaging.
- ✅ Use `denseTableStyle` for compact embedded tables rather than inventing new padding.
- ❌ Don't fetch in the view and hand-page a plain `Table` when `DataFetchingTable` fits.
- ❌ Don't make rows clickable without `onRowClick` (and the pointer/hover it brings).
