import { keyBy } from 'lodash';

export const mapInvoiceItemsForResponse = invoiceRecord => {
  // Convert to plain object to avoid circular references
  const invoice = invoiceRecord.get({ plain: true });

  // Map items with insurance plans and product codes
  const items = invoiceRecord.items.map((originalItem, index) => {
    const item = invoice.items[index];
    const productCode = originalItem.product?.getProductCode?.() ?? null;

    const insurancePlansById = keyBy(
      item.product?.invoiceInsurancePlanItems,
      'invoiceInsurancePlanId',
    );

    const insurancePlanItems =
      invoice.insurancePlans?.map(({ id, code, name, defaultCoverage }) => {
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
      ...item,
      insurancePlanItems,
      productCode,
    };
  });

  return { ...invoice, items };
};
