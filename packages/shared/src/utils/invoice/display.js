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

  const normalisedValue = parseFloat(value);

  return normalisedValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * get invoice summary for display
 * @param {Invoice} invoice
 */
export const getInvoiceSummaryDisplay = invoice => {
  const summary = getInvoiceSummary(invoice);
  return mapValues(summary, value => formatDisplayPrice(value));
};

export const getInvoiceItemPriceDisplay = invoiceItem => {
  const rawPriceValue = getInvoiceItemTotalPrice(invoiceItem);

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
