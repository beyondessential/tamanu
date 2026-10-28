import { keyBy } from 'es-toolkit/compat';

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

    const insurancePlansById = keyBy(
      item.product?.invoiceInsurancePlanItems,
      'invoiceInsurancePlanId',
    );

    const insurancePlanItems =
      invoiceRecord.insurancePlans?.map(({ id, code, name, defaultCoverage }) => {
        const planItem = insurancePlansById[id];
        const coverageValue = planItem?.coverageValue ?? defaultCoverage;
        return {
          id,
          code,
          name,
          label: name ?? code,
          coverageValue,
        };
      }) ?? [];

    return {
      ...plainItem,
      insurancePlanItems,
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
