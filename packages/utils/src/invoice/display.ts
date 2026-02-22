import { mapValues } from 'es-toolkit';
import Decimal from 'decimal.js';
import { getInvoiceSummary } from './invoice';
import {
  getItemTotalInsuranceCoverageAmount,
  getInvoiceItemTotalPrice,
  getInvoiceItemTotalDiscountedPrice,
  getInvoiceItemNetCost,
} from './invoiceItem';
import type { Invoice, InvoiceItem, InvoiceSummary } from './types';

export const round = (value: number | string | Decimal, decimals = 2): number => {
  return new Decimal(value).toNearest(new Decimal(10).pow(-decimals)).toNumber();
};

/**
 *
 */
export const formatDisplayPrice = (
  value: number | string | Decimal | undefined,
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const floatValue = typeof value === 'number' ? value : parseFloat(value.toString());
  if (isNaN(floatValue)) {
    return undefined;
  }

  return floatValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * get invoice summary for display
 */
export const getInvoiceSummaryDisplay = (
  invoice: Invoice,
): Record<keyof InvoiceSummary, string | undefined> => {
  const summary = getInvoiceSummary(invoice);
  return mapValues(summary, value => formatDisplayPrice(value)) as Record<
    keyof InvoiceSummary,
    string | undefined
  >;
};

export const getInvoiceItemPriceDisplay = (invoiceItem: InvoiceItem): string | undefined => {
  const rawPriceValue = getInvoiceItemTotalPrice(invoiceItem);

  const unformattedPrice = isNaN(parseFloat(rawPriceValue.toString())) ? undefined : rawPriceValue;

  return formatDisplayPrice(unformattedPrice);
};

export const getInvoiceItemDiscountPriceDisplay = (
  invoiceItem: InvoiceItem,
): string | undefined => {
  return formatDisplayPrice(
    isNaN(parseFloat(invoiceItem?.discount?.amount?.toString() || ''))
      ? undefined
      : getInvoiceItemTotalDiscountedPrice(invoiceItem),
  );
};

/**
 * Calculate and format the insurance coverage of an invoice item for display in printout
 * @param {InvoiceItem} item - The invoice item object
 * @returns {string} - The formatted insurance coverage of the item (e.g., "0.00")
 */
export const getFormattedInvoiceItemCoverageAmount = (item: InvoiceItem): string | undefined => {
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
export const getFormattedInvoiceItemNetCost = (item: InvoiceItem): string | undefined => {
  const netCost = getInvoiceItemNetCost(item);
  return formatDisplayPrice(netCost);
};
