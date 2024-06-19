import { round } from 'lodash';
import { INVOICE_STATUSES } from '@tamanu/constants';

export const isInvoiceEditable = invoice =>
  ![INVOICE_STATUSES.FINALISED, INVOICE_STATUSES.CANCELLED].includes(invoice.status);

const calculateInvoiceItemDiscountPrice = (price, discount) => {
  const priceFloat = parseFloat(price);
  const priceChange = discount * priceFloat;
  const result = round(priceFloat - priceChange, 2);
  return result;
};

const getInvoiceItemPrice = invoiceItem => {
  return parseFloat(invoiceItem?.productPrice ?? invoiceItem?.product?.price);
};

export const getInvoiceItemPriceDisplay = invoiceItem => {
  const result = getInvoiceItemPrice(invoiceItem);
  return isNaN(result) ? undefined : result.toFixed(2);
};

export const getInvoiceItemDiscountPriceDisplay = invoiceItem => {
  const originalPrice = getInvoiceItemPrice(invoiceItem);
  const discount = invoiceItem?.discount?.percentage;
  const result = calculateInvoiceItemDiscountPrice(originalPrice, discount);
  return isNaN(result) ? undefined : result.toFixed(2);
};

const calculateDiscountableItemsTotal = invoiceItems => {
  if (!invoiceItems?.length) return undefined;
  let total = 0;
  invoiceItems.forEach(item => {
    const price = item.productPrice ?? item.product?.price ?? item.price;
    if (!price) return;
    total += calculateInvoiceItemDiscountPrice(price, item.discount?.percentage || 0);
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
  const discountTotal = round(
    appliedToDiscountableSubtotal * (invoice.discount?.percentage || 0),
    2,
  );

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

export const getInvoiceItemName = invoiceItem => {
  return invoiceItem?.productName ?? invoiceItem?.product?.name ?? invoiceItem?.name;
};

export const getInvoiceItemCode = invoiceItem => {
  return invoiceItem?.product?.referenceData?.code || invoiceItem?.code;
};
