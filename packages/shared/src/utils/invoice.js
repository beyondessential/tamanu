import { round } from 'lodash';
import { INVOICE_STATUSES } from '@tamanu/constants';

export const isInvoiceEditable = invoice =>
  ![INVOICE_STATUSES.FINALISED, INVOICE_STATUSES.CANCELLED].includes(invoice.status);

const calculateInvoiceItemDiscountPrice = (price, discount = 0) => {
  const priceFloat = parseFloat(price);
  const priceChange = discount * priceFloat;
  const result = round(priceFloat - priceChange, 2);
  return result;
};

export const getInvoiceItemDiscountPrice = (price, discount) => {
  return calculateInvoiceItemDiscountPrice(price, discount).toFixed(2);
};

const calculateDiscountableItemsTotal = invoiceItems => {
  if (!invoiceItems?.length) return undefined;
  let total = 0;
  invoiceItems.forEach(item => {
    const price = item.product?.price ?? item.price;
    if (!price) return;
    total += calculateInvoiceItemDiscountPrice(price, item.discount?.percentage);
  });

  return total;
};

const calculateInsurersPercentage = insurers => {
  let total = 0;
  insurers.forEach(insurer => {
    const percentage = parseInt(insurer.percentage);
    total += percentage;
  });

  return total;
};

export const getInvoiceSummary = invoice => {
  const discountableItemsSubtotal = calculateDiscountableItemsTotal(invoice.items);
  const nonDiscountableItemsSubtotal = undefined;
  const total =
    discountableItemsSubtotal === undefined && nonDiscountableItemsSubtotal === undefined
      ? undefined
      : (discountableItemsSubtotal || 0) + (nonDiscountableItemsSubtotal || 0);

  const paidFromInsurersPercentage = calculateInsurersPercentage(invoice.insurers);
  const paidFromInsurers = round(total * paidFromInsurersPercentage, 2);
  const patientSubtotal = total - paidFromInsurers;

  const appliedToDiscountableSubtotal =
    discountableItemsSubtotal - round(discountableItemsSubtotal * paidFromInsurersPercentage, 2);
  const discountTotal = round(appliedToDiscountableSubtotal * invoice.discount?.percentage, 2);

  const patientTotal = patientSubtotal - discountTotal;

  return {
    discountableItemsSubtotal: discountableItemsSubtotal?.toFixed(2),
    nonDiscountableItemsSubtotal: nonDiscountableItemsSubtotal?.toFixed(2),
    total: total?.toFixed(2),
    appliedToDiscountableSubtotal: isNaN(appliedToDiscountableSubtotal)
      ? undefined
      : appliedToDiscountableSubtotal.toFixed(2),
    discountTotal: isNaN(discountTotal) ? undefined : discountTotal.toFixed(2),
    patientTotal: isNaN(patientTotal) ? undefined : patientTotal.toFixed(2),
  };
};
