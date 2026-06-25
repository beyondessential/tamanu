# Fixed-price medications

Flag a medication in a price list so it is charged as a **flat fee regardless of dispensed quantity** (instead of price × quantity). Per-unit pricing stays the default. Medications only.

Decoupled from the rest of the FSM invoicing work — it shares only "price lists exist" — so the full detail lives here rather than in the FSM Tech Design doc. Urgency: Yap is live with a manual workaround; Kosrae go-live is early August.

Linear: TAM-6897. Supersedes TAM-6843.

## Scope

In scope:

- Fixed-price charging for **medications** (invoice product category `Drug`).
- Per-price-list control: the same drug can be fixed in one price list and per-unit in another.
- Import/export of the fixed-price flag via the price-list spreadsheet.

Out of scope (v1):

- Fixed pricing for non-medication product types (labs, imaging, procedures). The importer never sets the flag on a non-medication (see import rules below).
- A distinct UI treatment for fixed-price lines (badges, hidden unit-price column, etc.).
- Medication grouping (one fixed fee covering several drugs). Revisit if config maintenance hurts.
- Palau outpatient scripts (same need — note for a fast-follow).

---

## Product decisions & acceptance criteria

### Pricing behaviour

- A fixed-price medication line is charged the flat fee **once per line, regardless of quantity** — the line total equals the fee (fee × 1), never fee × quantity.
- Fixed-vs-per-unit is **per price list**, set per medication. The same drug can be fixed in one price list and per-unit in another.
- The unit of charge is **one fixed fee per prescription/invoice line**. Medication lines normally accumulate into one line per drug per visit; if a drug somehow has two lines, each carries its own fixed fee.
- Quantity is **auto-derived as today** (administered via MAR + pharmacy-dispensed) and stays **displayed as-is**, but for a fixed line it is **informational only and must never affect the charged amount**.
- The fee lands on the **medication line itself** — Yap's manual "$0 line + a separate prescription fee item" workaround is retired.

### Discounts & insurance

- Discounts apply to the **fixed fee**, not to fee × quantity. A percentage discount of 10% on a $2.00 fixed line discounts to $1.80.
- Insurance coverage applies **proportionally to the (discounted) fixed fee**. 80% coverage on a $2.00 fixed line covers $1.60; the patient owes $0.40.
- Net cost, coverage caps, and invoice totals for a fixed line are all computed from the flat fee — quantity cannot leak into any of them.

### Trigger

- Same trigger as today: the fee lands once **at least one unit is dispensed/administered**. No dispense → no fee.
- Because the charge is quantity-independent, the fee is identical whether 1 or 100 units are dispensed.

### Manual edits

- A cashier may edit/remove a fixed-price line like any other invoice item.
- If a cashier **manually overrides the price** on a fixed line, the line **stays fixed**: the charged amount is the override × 1 (e.g. overriding a $2.00 fixed line to $3.50 charges $3.50, not $3.50 × quantity). Fixedness is a property of the line, independent of where the price came from.
- A **manually-added ad-hoc item** (not linked to a price-list item) is always per-unit — there is no price-list item to carry the fixed flag.

### Finalisation

- A fixed line **stays fixed after the invoice is finalised**, even if the price-list item is later edited or removed. Fixedness is snapshotted onto the invoice item at finalisation (alongside the unit price), so a finalised fixed line is never recomputed as price × quantity.

### Display (v1)

- Quantity shows the dispensed count; the line total shows the flat fee. No badge, no struck-through unit price, no hidden column.
- This is accepted to read oddly (e.g. quantity 30, unit price $2.00, total $2.00). A nicer treatment is a deliberate fast-follow, not part of this card.

---

## Import / config

The price-list importer uses a product-by-code matrix: first column header `invoiceProductId`, remaining headers are price-list codes, each cell a numeric price (or `hidden`). A cell is always **exactly one of**: empty (no price) / plain number (per-unit) / fixed number / `hidden`. `hidden` and fixed are mutually exclusive — there is no combined marker.

### Per-cell fixed marker

- An **`f` prefix** (case-insensitive), e.g. `f2.00`, marks an individual cell as a fixed fee. `F2.00` is equivalent.
- `f` always means **fixed**. There is no per-cell marker to force per-unit (see column default below).

### Column-level default (Kosrae "all medications fixed")

- A price-list column can be marked fixed-by-default with the **`:fixed` header token** appended to the price-list code, e.g. `KOSRAE:fixed`. Every plain number in that column is then a fixed fee.
- **Header resolution is code-first** (collision-proof): the importer first tries the **whole header** as a price-list code; only if that doesn't match an existing code does it strip a trailing `:fixed` and retry. So a column `KOSRAE:fixed` maps to price list `KOSRAE` as a fixed-default column, while a hypothetical real code containing `:fixed` would still resolve as itself. A header that matches no code either way is the existing "price list does not exist" error.
- A fixed-by-default column is **all-or-nothing in v1**: there is no way to mark an individual cell back to per-unit. A price list with per-unit exceptions does not use the column default — instead each fixed cell is marked explicitly with `f` (the Yap pattern: `f2.00` for tablets/capsules, plain `0.50` for bottles/tubes).

### Parsing & validation

- Detection handles **both numeric and text cells in the same column** — a prefixed cell arrives as text, a plain cell as a number.
- Marker matching is **case-insensitive** and **trims surrounding whitespace**; decimal parsing is **locale-safe** (consistent with existing price parsing).
- The marker is **import syntax only**. It parses to an `isFixedPrice` boolean plus a numeric `price` on `InvoicePriceListItem`; the prefix is never stored as a string.
- An `f` marker with no valid number (e.g. `f`, `fabc`) is an **import error**, reported like other invalid price values.
- Fixed pricing is **only valid for medications** (product category `Drug`), enforced at import:
  - An explicit `f` marker on a **non-medication** product is an **import error** (it's a mistake the configurer should fix).
  - A `:fixed` **column default** on a non-medication row is **silently ignored** — the plain number imports as a normal per-unit price (the column default is a bulk convenience that simply doesn't apply to non-medications).

### Export round-trip

- The price-list export **re-emits the fixed marker** so an exported sheet re-imports identically (PMs export → edit → re-import without losing fixed-price config).
- Export emits the **per-cell `f` prefix** on fixed cells (`f2.00`) and plain numbers elsewhere; it does not attempt to reconstruct the `:fixed` column-default token. This is lossless on re-import — every fixed cell is explicitly marked — just more verbose than the hand-authored form.

---

## Technical design

- **Flag location:** `isFixedPrice` boolean on `InvoicePriceListItem` (per medication, per price list), modelled on the existing `isHidden` boolean. Not on `InvoiceProduct` — fixed-vs-per-unit is contextual to the price list. Server (Sequelize) migration only — invoicing has no mobile models, so no TypeORM migration. Update the dbt source model.
- **Finalisation snapshot:** invoice finalisation already copies the unit price into `priceFinal`; add a matching `isFixedPriceFinal` on the invoice item so finalised fixed lines keep their behaviour independent of later price-list edits.
- **Single calc surface:** the line total is `getInvoiceItemPrice() × quantity` in one place (`packages/utils/src/invoice/invoiceItem.ts`). A fixed line is "price × 1" — one conditional in `getInvoiceItemTotalPrice`, gated on the product being a medication (`category === 'Drug'`) and `invoicePriceListItem.isFixedPrice`. Discount, insurance coverage, net cost, and invoice totals all derive from this, so they inherit fixed behaviour automatically. The conditional must be respected wherever a total/coverage/net-cost is computed so quantity cannot leak in.
- **No medication "form" field exists.** Form is only free-text `units` on the prescription, so the system cannot compute "is this a tablet". Config flags the right products in the right price lists instead — no `ReferenceData` migration.
- **Quantity stays auto-derived** (`recalculateAndApplyInvoiceQuantity()` sums MAR-given + pharmacy-dispensed); for fixed lines this value is informational only.
- **Import** lives in `invoicePriceListItemLoaderFactory.js` (via `ProductMatrixByCodeLoaderFactory`): extend the `valueExtractor` to detect the `f` prefix and return `{ parsedValue, isValidValue, isFixedPrice }`; resolve the column default by the code-first header rule (try the whole header as a code, strip a trailing `:fixed` only on a miss). **Export** mirrors it in `InvoicePriceListItemExporter.js`: load `isFixedPrice` and emit `f${price}` for fixed cells.
- **Constants:** the `f` marker and the `:fixed` header token sit alongside `INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES.HIDDEN` in `packages/constants/src/invoices.ts`.

---

## Open questions

_None outstanding._
