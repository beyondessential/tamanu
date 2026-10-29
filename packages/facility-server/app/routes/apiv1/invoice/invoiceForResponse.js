import { getInsurancePlanItemsForInvoiceItem } from '@tamanu/utils/invoice';

// Map invoice items with insurance plans and product codes & convert the Sequelize object to a plain object
export const invoiceForResponse = invoiceRecord => {
  const processedItems = invoiceRecord.items.map(item => {
    const plainItem = item.get?.({ plain: true }) ?? item;
    const productCode = item.product?.getProductCode?.() ?? null;

    if (!item.product?.insurable) {
      return {
        ...plainItem,
        productCode,
      };
    }

    return {
      ...plainItem,
      insurancePlanItems: getInsurancePlanItemsForInvoiceItem(item, invoiceRecord.insurancePlans),
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
