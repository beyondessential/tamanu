export const getInvoiceLineCode = (row) => {
  const itemType = row?.invoiceLineType?.itemType;
  switch (itemType) {
    // case INVOICE_LINE_TYPES.PROCEDURE_TYPE:
    //   return row?.invoiceLineType?.procedureType?.code;
    // case INVOICE_LINE_TYPES.IMAGING_TYPE:
    //   return row?.invoiceLineType?.imagingType?.code;
    // case INVOICE_LINE_TYPES.LAB_TEST_TYPE:
    //   return row?.invoiceLineType?.labTestType?.code;
    default:
      return '';
  }
};
