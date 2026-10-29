import { getInsurancePlanItemsForInvoiceItem } from '@tamanu/utils/invoice';

/**
 * The invoice as it is priced: a plain object whose insurable items carry the coverage each of the
 * invoice's insurance plans gives them. The web and the server's payment checks both price this
 * shape, so they agree on what is owed.
 */
export const invoiceForPricing = invoiceRecord => {
  const pricedItems = invoiceRecord.items.map(item => {
    const plainItem = item.get?.({ plain: true }) ?? item;

    if (!item.product?.insurable) {
      return plainItem;
    }

    return {
      ...plainItem,
      insurancePlanItems: getInsurancePlanItemsForInvoiceItem(item, invoiceRecord.insurancePlans),
    };
  });

  // Convert to plain object to avoid circular references
  const plainInvoice = invoiceRecord.get?.({ plain: true }) ?? invoiceRecord;
  return {
    ...plainInvoice,
    items: pricedItems,
  };
};

// The invoice as the API returns it: the priced invoice, with each item's product code
export const invoiceForResponse = invoiceRecord => {
  const invoice = invoiceForPricing(invoiceRecord);
  return {
    ...invoice,
    items: invoice.items.map((item, index) => ({
      ...item,
      productCode: invoiceRecord.items[index].product?.getProductCode?.() ?? null,
    })),
  };
};
