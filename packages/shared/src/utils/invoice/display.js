import { mapValues } from 'lodash';
import Decimal from 'decimal.js';
import { getInvoiceSummary } from './invoice';
import {
  getItemTotalInsuranceCoverageAmount,
  getInvoiceItemTotalPrice,
  getInvoiceItemTotalDiscountedPrice,
  getInvoiceItemNetCost,
} from './invoiceItem';

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

/**
 * Calculate and format the insurance coverage of an invoice item for display in printout
 * @param {InvoiceItem} item - The invoice item object
 * @returns {string} - The formatted insurance coverage of the item (e.g., "0.00")
 */
export const getFormattedInvoiceItemCoverageAmount = item => {
  if (!item?.product?.insurable || !item.insurancePlanItems?.length) {
    return formatDisplayPrice(0);
  }
  const coverage = getItemTotalInsuranceCoverageAmount(item);
  return formatDisplayPrice(-coverage);
};

/**
 * Calculate and format the net cost of an invoice item for display in printout
 * @param {InvoiceItem} item - The invoice item object
 * @returns {string} - The net cost of the item
 */
export const getFormattedInvoiceItemNetCost = item => {
  const netCost = getInvoiceItemNetCost(item);
  return formatDisplayPrice(netCost);
};
