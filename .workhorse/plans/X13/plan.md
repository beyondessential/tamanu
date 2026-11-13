# Fee schedule page in central admin

## Design decisions

- **Where it lives.** A Fee schedule page in the central admin panel, not facility admin. Price list items, lab tests and insurance plan items only sync from central to facilities, so editing on central avoids changing sync directions. Les confirmed cashiers can use the central admin panel.
- **Access.** A new fee schedule permission opens the page. Cashier roles get it instead of the general invoicing permissions, so the reference data Manage tab can't be used to edit other facilities' prices.
- **Who can edit what.**
  - Everyone with the permission sees every facility's prices.
  - A price list is editable when it covers any of the user's allowed facilities.
  - Availability at a facility is editable by users allowed at that facility.
  - Product names, insurance coverage and the catch-all price list are editable by anyone with the permission. Still to confirm with Les.
- **Price lists covering several facilities.** In scope for this card. Today a price list's facility rule names one facility and is matched exactly (`packages/database/src/models/Invoice/invoicePriceListMatching.ts`). It needs to accept a list of facilities, with matching, the exclusionary catch-all logic and the price list import spreadsheet updated to suit.
- **Availability.** Hiding a product at a facility removes that facility from the source record's available facilities list. Hiding a product that is available everywhere means listing every other facility. Showing it everywhere again resets the list to empty.
- **Layout.** A multi-select facility filter defaulting to all facilities. Columns are grouped per facility (its Available toggle and its own price lists), with a further group for each set of facilities sharing price lists. Product, Category and insurance coverage come first, with Product pinned.
- **Saving.** Edits are held as unsaved changes and saved together. Saving asks for confirmation, and says unfinalised invoices will use the new prices when any price changed.
- **Price states.** A cell can hold a price, be blank (the item is still added and the cashier types the price on the invoice), or be not charged (`isHidden`, no line is added). Cashiers can move a cell between all three, including clearing a price back to blank.
- **Price lists themselves.** Creating price lists and changing their name, facility, patient type and age rules and evaluation order stays with the reference data import. The page edits only what sits inside existing lists.
- **Clashes.** The last save wins, field by field. No stale-edit check.
- **Unsaved changes.** Changing a filter or leaving the page with unsaved changes asks the user to save or discard first.
- **Price validation.** A price is a positive amount; zero and negative prices are rejected. To not charge, use Not charged. Zero prices that came in by import still display.
- **Coverage.** Follows the import's behaviour: a blank coverage cell means the plan has no coverage entry for the product, and once set a coverage can be changed but not cleared (set it to 0 instead). Coverage is a percentage from 0 to 100.
- **Products listed.** Current products by default, with a toggle to include historical products, shown read-only. Adding and retiring products stays with import.
- **Read and write.** The fee schedule permission has read (page opens with everything read-only) and write levels.
- **Flat fee without a price.** A medication's charge type is kept independently of its price, so it can be a flat fee with a blank price. The cashier's invoice override is then charged once, per the fixed-price medications spec.
- **No export from the page.** The reference data export already produces the price list sheets.
- **Saving is all or nothing.** All unsaved changes go in one transaction; if any is rejected, none are saved and the rejected cells are marked.
- **No edit history in the grid.** The change log records every edit for support.
- **Multi-facility rule format.** In the price list's `rules` JSON, `facilityId` accepts either a single facility id (as today) or an array of ids, so existing spreadsheets keep working.
- **Product names.** An invoice product's name is separate from its source record's name (a lab test type, a drug), so renaming a product changes only what appears on invoices.

## Open

- Confirm with Les that cashiers editing product names, coverage and the catch-all list across states is acceptable.
- Review the price editor pop-up (price, charge type for drugs, not charged).
