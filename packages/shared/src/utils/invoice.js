import { round } from 'lodash';
import { INVOICE_STATUSES } from '@tamanu/constants';

export const isInvoiceEditable = invoice =>
  ![INVOICE_STATUSES.FINALISED, INVOICE_STATUSES.CANCELLED].includes(invoice.status);

const formatDisplayValue = value => (isNaN(value) ? undefined : value.toFixed(2));

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
  return formatDisplayValue(result);
};

export const getInvoiceItemDiscountPriceDisplay = invoiceItem => {
  const originalPrice = getInvoiceItemPrice(invoiceItem);
  const discount = invoiceItem?.discount?.percentage;
  const result = calculateInvoiceItemDiscountPrice(originalPrice, discount);
  return formatDisplayValue(result);
};

const calculateDiscountableItemsTotal = invoiceItems => {
  if (
    !invoiceItems?.filter(item => !!(item.productPrice ?? item.product?.price ?? item.price))
      ?.length
  )
    return undefined;
  let total = 0;
  invoiceItems.forEach(item => {
    const price = item.productPrice ?? item.product?.price ?? item.price;
    if (!price) return;
    total += calculateInvoiceItemDiscountPrice(price, item.discount?.percentage || 0);
  });

  return total;
};

const calculateInsurerPayments = (insurers, total) => {
  return insurers.map(insurer => {
    const percentage = parseFloat(insurer.percentage);
    if (isNaN(insurer.percentage)) return undefined;
    return round(total * percentage, 2);
  });
};

export const getInsurerPaymentsDisplay = (insurers, total) => {
  const payments = calculateInsurerPayments(insurers, total);
  return payments.map(payment => formatDisplayValue(payment));
};

export const getInvoiceSummary = invoice => {
  const discountableItemsSubtotal = calculateDiscountableItemsTotal(invoice.items);
  const nonDiscountableItemsSubtotal = undefined;
  const total =
    discountableItemsSubtotal === undefined && nonDiscountableItemsSubtotal === undefined
      ? undefined
      : (discountableItemsSubtotal || 0) + (nonDiscountableItemsSubtotal || 0);

  const paidFromInsurersPercentage = invoice.insurers
    .filter(insurer => insurer.percentage)
    .reduce((acc, val) => acc + val.percentage, 0);
  const paidFromInsurers = calculateInsurerPayments(invoice.insurers, total)
    .filter(Boolean)
    .reduce((acc, val) => acc + val, 0);

  const patientSubtotal = total - paidFromInsurers;

  const appliedToDiscountableSubtotal = round(
    discountableItemsSubtotal - discountableItemsSubtotal * paidFromInsurersPercentage,
    2,
  );
  const discountTotal = round(
    appliedToDiscountableSubtotal * (invoice.discount?.percentage || 0),
    2,
  );

  const patientTotal = patientSubtotal - discountTotal;

  return {
    discountableItemsSubtotal: discountableItemsSubtotal?.toFixed(2),
    nonDiscountableItemsSubtotal: nonDiscountableItemsSubtotal?.toFixed(2),
    total: total?.toFixed(2),
    appliedToDiscountableSubtotal: formatDisplayValue(appliedToDiscountableSubtotal),
    discountTotal: formatDisplayValue(discountTotal),
    patientSubtotal: formatDisplayValue(patientSubtotal),
    patientTotal: formatDisplayValue(patientTotal),
  };
};

export const getInvoiceItemName = invoiceItem => {
  return invoiceItem?.productName ?? invoiceItem?.product?.name;
};

export const getInvoiceItemCode = invoiceItem => {
  return invoiceItem?.product?.referenceData?.code ?? invoiceItem?.productCode;
};
