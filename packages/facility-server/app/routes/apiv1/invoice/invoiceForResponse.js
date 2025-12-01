import { keyBy } from 'lodash';

// Map invoice items with insurance plans and product codes & convert the Sequelize object to a plain object
export const invoiceForResponse = invoiceRecord => {
  const processedItems = invoiceRecord.items.map(item => {
    const productCode = item.product?.getProductCode?.() ?? null;

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

    const plainItem = item.get?.({ plain: true }) ?? item;

    return {
      ...plainItem,
      insurancePlanItems,
      productCode,
    };
  });

  // Convert to plain object to avoid circular references
  const plainInvoice = invoiceRecord.get?.({ plain: true }) ?? invoiceRecord;
  return {
    ...plainInvoice,
    items: processedItems,
  };
};
