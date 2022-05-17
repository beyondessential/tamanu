import { INVOICE_STATUSES, INVOICE_PAYMENT_STATUSES } from 'shared/constants';

export const isInvoiceEditable = invoice =>
  ![INVOICE_STATUSES.FINALISED, INVOICE_STATUSES.CANCELLED].includes(invoice.status) &&
  invoice.paymentStatus === INVOICE_PAYMENT_STATUSES.UNPAID;

export const calculateInvoiceTotal = (invoiceLines, invoicePriceChanges) => {
  const total = calculateInvoiceLinesTotal(invoiceLines);
  let priceChange = 0;
  invoicePriceChanges.forEach(invoicePriceChange => {
    const itemPriceChange = invoicePriceChange.percentageChange * total;
    priceChange += itemPriceChange;
  });

  return Math.round((total + priceChange) * 100) / 100;
};

export const calculateInvoiceLinesTotal = invoiceLines => {
  let total = 0;
  invoiceLines.forEach(invoiceLine => {
    const price = parseFloat(invoiceLine.invoiceLineType.price);
    const priceChange = (invoiceLine.percentageChange || 0) * price;
    total += price + priceChange;
  });

  return Math.round(total * 100) / 100;
};

export const getInvoiceTotal = async (api, invoiceId) => {
  const { data: invoiceLineItems } = await api.get(`invoices/${invoiceId}/lineItems`);
  const { data: invoicePriceChangeItems } = await api.get(`invoices/${invoiceId}/priceChangeItems`);
  return calculateInvoiceTotal(invoiceLineItems, invoicePriceChangeItems);
};
