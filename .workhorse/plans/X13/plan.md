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

## Open

- Confirm with Les that cashiers editing product names, coverage and the catch-all list across states is acceptable.
- Review the price editor pop-up (price, charge type for drugs, not charged).
