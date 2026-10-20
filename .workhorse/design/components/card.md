---
title: Card
---
# Card

**Source:** `packages/web/app/components/InfoCard.jsx`, `Tile.jsx`
· **Preview:** [`./card.html`](./card.html)

Grouping surfaces for read-only information. The real card container is
**`InfoCard`** — a white bordered panel holding label/value pairs. (`Card.jsx`
exports only a legacy inline `CardItem` with no current importers; use `InfoCard`.)
**`Tile`** is the small metric/stat tile used in rows on dashboards and summaries.

## InfoCard

A bordered panel whose body is a grid of `InfoCardItem` label/value pairs, with an
optional `InfoCardHeader`.

| Prop (`InfoCard`) | Default | Purpose |
|---|---|---|
| `numberOfColumns` | `2` | Grid columns in the body |
| `elevated` | falsy | Adds shadow `2px 2px 25px rgba(0,0,0,0.1)` |
| `inlineValues` | falsy | Label and value on one line (`label: value`) vs stacked |
| `contentPadding` | `32` | Card padding (px) |
| `headerContent` | — | Header row (usually an `InfoCardHeader`) |

`InfoCardItem` takes `label`, `value`, and `numberOfColumns` (must match the card
so the vertical dividers line up).

```
InfoCard                         white; border 1px #dedede; border-radius 5px; padding 32px
├ InfoCardHeader (optional)      border-bottom 1px #ebebeb; padding-bottom 10px; 16px #888
└ body grid (numberOfColumns)    col-gap 30px; row-gap 18px; vertical divider 1px #ebebeb between columns
    InfoCardItem                 label #888; value #666 weight 500
```

## Tile

A compact stat block: icon (top-left), caption, and a large value. Lay tiles out
in a row with `TileContainer`.

| Prop (`Tile`) | Default | Purpose |
|---|---|---|
| `Icon` | Label icon | Icon top-left, `color="primary"` |
| `text` | — | Caption above the value |
| `main` | — | The primary value |
| `actions` | — | Optional kebab menu (hidden when `isReadOnly`) |

```
Tile   white; border-radius 5px; padding 10px 10px 8px; width 150px
       caption 14px #888; value 14px weight 500
```

## Do / don't

- ✅ Use `InfoCard` + `InfoCardItem` for patient/record detail panels; keep
  `numberOfColumns` consistent between card and items.
- ✅ Use `inlineValues` for compact `label: value` summaries, stacked for roomier ones.
- ✅ Use `Tile` rows for at-a-glance counts/status; wrap them in `TileContainer`.
- ❌ Don't use the legacy `CardItem` from `Card.jsx` — use `InfoCard`/`InfoCardItem`.
- ❌ Don't add shadows to cards except via `elevated`.
