import { mapValues } from 'lodash';
import Decimal from 'decimal.js';
import {
  getInvoiceItemTotalDiscountedPrice,
  getInvoiceItemTotalPrice,
  getInvoiceSummary,
} from './invoice';

export const round = (value, decimals = 2) => {
  return new Decimal(value).toNearest(new Decimal(10).pow(-decimals)).toNumber();
};
/**
 *
 * @param {number} value
 * @returns
 */
export const formatDisplayPrice = value => {
  if (isNaN(parseFloat(value))) {
    return undefined;
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * get invoice summary for display
 * @param {Invoice} invoice
 */
export const getInvoiceSummaryDisplay = invoice => {
  const discountableItems = invoice.items.filter(
    item => item.productDiscountable && !isNaN(parseFloat(item.productPrice)),
  );
  const nonDiscountableItems = invoice.items.filter(
    item => !item.productDiscountable && !isNaN(parseFloat(item.productPrice)),
  );
  const summary = getInvoiceSummary(invoice);
  return mapValues(summary, (value, key) => {
    if (!discountableItems.length && !nonDiscountableItems.length) return undefined;
    if (!discountableItems.length && key === 'discountableItemsSubtotal') return undefined;
    if (!nonDiscountableItems.length && key === 'nonDiscountableItemsSubtotal') return undefined;
    return formatDisplayPrice(value);
  });
};

export const getInvoiceItemPriceDisplay = invoiceItem => {
  const rawPriceValue =
    invoiceItem.productPrice ?? invoiceItem?.product?.invoicePriceListItem?.price;

  const unformattedPrice = isNaN(parseFloat(rawPriceValue))
    ? undefined
    : getInvoiceItemTotalPrice(invoiceItem);

  return formatDisplayPrice(unformattedPrice);
};

export const getInvoiceItemDiscountPriceDisplay = invoiceItem => {
  return formatDisplayPrice(
    isNaN(parseFloat(invoiceItem?.discount?.amount))
      ? undefined
      : getInvoiceItemTotalDiscountedPrice(invoiceItem),
  );
};
