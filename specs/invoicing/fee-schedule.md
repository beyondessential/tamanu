---
id: FSCHED
---

# Fee schedule

Applies to the Fee schedule page in the central admin panel, where staff view and edit invoice prices, charging types, insurance coverage, product names and product availability across facilities.

## Access

- The Fee schedule page appears in the central admin sidebar for users with permission to read the fee schedule.
- Read permission opens the page with every value read-only.
- Write permission allows edits, within the facility limits under [Who can edit what](#who-can-edit-what).
- The fee schedule permission is separate from the permissions for managing price lists and invoice products as reference data, so a cashier holds it without being able to edit other facilities' prices through reference data management.

## Who can edit what

- A user's facilities are the facilities they are allowed to access. A user allowed at every facility can edit every value on the page.
- A price list is editable by a user when it applies at any of their facilities, including a list shared with facilities they are not allowed at.
- A price list with no facility rule, product names and insurance coverage are editable by every user with write permission.
- A product's availability at a facility is editable only by users allowed at that facility.
- A value the user cannot edit shows as plain read-only text, and an availability toggle they cannot change shows as disabled.

> [!NOTE]
> Product names, coverage and the catch-all price list apply across every state, and no single state owns them. Letting every fee schedule editor change them avoids a separate national role for values that change rarely.

## The grid

- Each row is an invoice product. Current products are listed by default, and a toggle includes historical products, which show read-only.
- The leading columns are Product, Category and one column per insurance plan. The Product column stays in view when the grid scrolls sideways.
- Each facility has a column group holding its Available toggle and the price lists that apply only at that facility.
- Each set of facilities that shares a price list has its own column group, headed with those facilities' names.
- Price lists with no facility rule sit in an All other facilities group.

## Filters

- The Facilities filter is a multi-select, defaulting to all facilities.
- Selecting facilities shows their own groups and every shared group that includes any of them.
- The All other facilities group shows when the filter includes a facility that no price list names.
- The Category filter narrows the rows to one invoice product category.
- The product search narrows the rows to products whose name contains the search text.

## Prices

- A price cell shows the price, is blank, or shows Not charged.
- A blank price means the product is still added to invoices using that price list, and the cashier enters its price on the invoice.
- Not charged means the product is not added automatically to invoices using that price list.
- A medication charged as a flat fee shows a Flat fee tag beside its price.
- Selecting an editable price cell opens the price editor, which sets the price, the charge type and whether the product is charged.
- A price is a positive amount. Zero and negative prices are rejected with an inline message.
- Leaving the price empty in the editor makes the cell blank.
- The charge type is offered only for medications, as Per unit or Flat fee, and behaves as described in [Fixed-price medications](fixed-price-medications.md). A medication can be a flat fee with a blank price.
- Invoices that are not yet finalised use the new prices. Finalised invoices keep the prices captured when they were finalised.

## Insurance coverage

- Each insurance plan column shows the plan's coverage of the product as a percentage.
- Coverage is shown only for insurable products.
- Coverage is a percentage from 0 to 100.
- A blank coverage cell means the plan has no coverage set for the product. Once set, coverage can be changed, including to 0, but not cleared.

## Product names

- A product's name is edited directly in its cell, and cannot be empty.
- Renaming a product changes the name shown on invoices. The record it is charged for, such as a lab test or a drug, keeps its own name.

## Availability

- A product has an Available toggle at each facility when the record it is charged for can be limited to particular facilities, as drugs, lab tests and lab test panels can.
- A product with no such record shows no toggle.
- Turning availability off at a facility stops the product's record being offered for ordering at that facility.
- Turning availability back on at every facility makes the record available everywhere, including at facilities added later.

## Saving

- Edits are held as unsaved changes until saved. Each changed cell is highlighted, and a save bar shows the number of unsaved changes with Discard and Save changes.
- Save changes asks for confirmation, stating how many prices and how many other values are being saved.
- When any price has changed, the confirmation also says that invoices that are not finalised will use the new prices.
- All unsaved changes save together: when any one is rejected, none are saved and the rejected cells are marked.
- Changing a filter, the historical products toggle, or leaving the page with unsaved changes asks the user to save or discard them first.
- When two users save changes to the same value, the later save stands.
