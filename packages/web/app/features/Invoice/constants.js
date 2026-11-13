// Read-only widths (inline invoice view)
export const CELL_WIDTHS = /** @type {const} */ ({
  DATE: '6em',
  DETAILS: '12em',
  QUANTITY: '6em',
  APPROVED: '6em',
  ORDERED_BY: '12em',
  PRICE: '6em',
  NET_COST: '8em',
  ACTIONS: 0,
});

// Editable widths (modal views — wider to accommodate form fields and icons)
export const CELL_WIDTHS_EDITABLE = /** @type {const} */ ({
  DATE: '12em',
  DETAILS: '16em',
  QUANTITY: '6em',
  APPROVED: '6em',
  ORDERED_BY: '14em',
  PRICE: '6em',
  NET_COST: '6em',
  ACTIONS: 0,
});

/**
 * How many columns the item table renders, which the section headers and the per-section Add item
 * rows span. Derived from the widths above rather than restated, so a new column reaches them
 * too: the editable views drop Actions, and the read-only views add a leading insurance-toggle
 * cell that carries no width of its own. Both match `InvoiceItemHeader`.
 */
export const invoiceItemColumnCount = isEditing =>
  isEditing ? Object.keys(CELL_WIDTHS).length - 1 : Object.keys(CELL_WIDTHS).length + 1;

export const INVOICE_FORM_TYPE = /** @type {const} */ ({
  ADD_ITEMS: 'add_items',
  READ_ONLY: 'read_only',
  EDIT_ITEMS: 'edit_items',
});
