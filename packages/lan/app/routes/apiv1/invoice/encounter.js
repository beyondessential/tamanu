import { customAlphabet } from 'nanoid';
import { INVOICE_STATUS_TYPES, INVOICE_PAYMENT_STATUS_TYPES } from 'shared/constants';

export const createInvoiceForEncouter = async (models, encounter) => {
  const { patientId, id } = encounter;
  const displayId =
    customAlphabet('0123456789', 8)() + customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 2)();
  // Create a corresponding invoice with the encounter when admitting patient
  const invoice = await models.Invoice.create({
    encounterId: id,
    displayId,
    status: INVOICE_STATUS_TYPES.IN_PROGRESS,
    paymentStatus: INVOICE_PAYMENT_STATUS_TYPES.UNPAID,
  });

  // Expect to always have a patient additional data corresponding to a patient
  const { patientBillingTypeId } = await models.PatientAdditionalData.findOne({
    where: { patientId },
  });
  const invoicePriceChangeType = await models.InvoicePriceChangeType.findOne({
    where: { itemId: patientBillingTypeId },
  });

  // automatically apply price change (discount) based on patientBillingType
  if (invoicePriceChangeType) {
    await models.InvoicePriceChangeItem.create({
      description: invoicePriceChangeType.name,
      percentageChange: invoicePriceChangeType.percentageChange,
      invoicePriceChangeTypeId: invoicePriceChangeType.id,
      invoiceId: invoice.id,
    });
  }
};
