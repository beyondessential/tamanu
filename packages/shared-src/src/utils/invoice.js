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
    const percentageChange = (invoiceLine.percentageChange || 0) * price;
    total += price + percentageChange;
  });

  return Math.round(total * 100) / 100;
};
