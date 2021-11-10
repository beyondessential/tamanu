import { customAlphabet } from 'nanoid';
import { INVOICE_STATUS_TYPES, INVOICE_PAYMENT_STATUS_TYPES } from 'shared/constants';

const generateInvoiceDisplayId = () =>
  customAlphabet('0123456789', 8)() + customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 2)();

export const postEncounterHandler = async (req, res) => {
  req.checkPermission('list', 'Encounter');

  const { models, body: encounterData, getLocalisation } = req;

  const encounter = await models.Encounter.create(encounterData);
  const localisation = await getLocalisation();

  if (!localisation?.enableInvoicing) {
    res.send(encounter);
    return;
  }

  const { patientId } = encounterData;
  const displayId = generateInvoiceDisplayId();

  // Create a corresponding invoice with the encounter when admitting patient
  const invoice = await models.Invoice.create({
    encounterId: encounter.id,
    displayId,
    status: INVOICE_STATUS_TYPES.IN_PROGRESS,
    paymentStatus: INVOICE_PAYMENT_STATUS_TYPES.UNPAID,
  });

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

  res.send(encounter);
};
