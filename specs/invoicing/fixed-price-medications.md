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

Charging type is configured in its own spreadsheet tab — **Invoice Price List Charging** — kept separate from the price matrix so prices stay purely numeric (no letters-in-number cells) and a future per-facility price-list UI can present pricing type as its own field. The tab mirrors the price tab's shape exactly: first column header `invoiceProductId`, remaining headers are **price-list codes**, each cell holds **`flatFee`** or **`perUnit`**.

It maps 1:1 onto the same `InvoicePriceListItem` rows as the price tab — `flatFee` → `isFixedPrice = true`, `perUnit` → `false`. The two tabs merge onto one row per (product × price list); the charging tab carries no price and the price tab carries no charging type.

### Cell values & validation

- Valid cell values are **`flatFee`** or **`perUnit`** (case-insensitive, trimmed). Any other value is an **import error**.
- A value is **required in every cell** present in the tab — a blank cell is an **import error** (no implicit default). A product or price list simply absent from the tab is per-unit (its `isFixedPrice` stays `false`).
- Fixed pricing is **only valid for medications** (product category `Drug`): `flatFee` on a **non-medication** product is an **import error**. `perUnit` is allowed on any product (it's the default and a no-op).
- The charging tab is imported **after** the price tab (it depends on it), so it reuses the existing price-list-item rows and merges `isFixedPrice` onto them rather than creating duplicates.

### Export round-trip

- Export emits the **Invoice Price List Charging** tab with an explicit `flatFee`/`perUnit` for every item (fixed → `flatFee`, otherwise `perUnit`), so an exported sheet re-imports identically with no blanks.

---

## Technical design

- **Flag location:** `isFixedPrice` boolean on `InvoicePriceListItem` (per medication, per price list), modelled on the existing `isHidden` boolean. Not on `InvoiceProduct` — fixed-vs-per-unit is contextual to the price list. Server (Sequelize) migration only — invoicing has no mobile models, so no TypeORM migration. Update the dbt source model.
- **Finalisation snapshot:** invoice finalisation already copies the unit price into `priceFinal`; add a matching `isFixedPriceFinal` on the invoice item so finalised fixed lines keep their behaviour independent of later price-list edits.
- **Single calc surface:** the line total is `getInvoiceItemPrice() × quantity` in one place (`packages/utils/src/invoice/invoiceItem.ts`). A fixed line is "price × 1" — one conditional in `getInvoiceItemTotalPrice`, gated on the product being a medication (`category === 'Drug'`) and `invoicePriceListItem.isFixedPrice`. Discount, insurance coverage, net cost, and invoice totals all derive from this, so they inherit fixed behaviour automatically. The conditional must be respected wherever a total/coverage/net-cost is computed so quantity cannot leak in.
- **No medication "form" field exists.** Form is only free-text `units` on the prescription, so the system cannot compute "is this a tablet". Config flags the right products in the right price lists instead — no `ReferenceData` migration.
- **Quantity stays auto-derived** (`recalculateAndApplyInvoiceQuantity()` sums MAR-given + pharmacy-dispensed); for fixed lines this value is informational only.
- **Import:** a dedicated **`invoicePriceListCharging`** importable type (`invoicePriceListChargingLoaderFactory.js`, via `ProductMatrixByCodeLoaderFactory`) with `valueField: 'isFixedPrice'` and a value extractor that maps `flatFee`/`perUnit` → boolean, errors on blank/unknown, and errors on `flatFee` for non-medications. It `needs: ['invoicePriceList', 'invoiceProduct', 'invoicePriceListItem']` so it runs after the price items exist and merges `isFixedPrice` onto the same rows. **Export** mirrors it in `InvoicePriceListChargingExporter.js`. The price tab (`invoicePriceListItem`) is unchanged — plain numbers and `hidden` only.
- **Constants:** `INVOICE_PRICE_LIST_CHARGING_VALUES` (`flatFee` / `perUnit`) in `packages/constants/src/invoices.ts`; the `invoicePriceListCharging` importable type in `importable.ts`.

---

## Open questions

_None outstanding._
