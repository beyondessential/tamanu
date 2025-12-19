import { INVOICE_ITEMS_CATEGORIES } from '@tamanu/constants';
import type { Procedure } from './Procedure';

const addToInvoice = async (instance: Procedure) => {
  const invoiceProduct = await instance.sequelize.models.InvoiceProduct.findOne({
    where: {
      category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
      sourceRecordId: instance.procedureTypeId,
    },
  });
  if (!invoiceProduct) {
    return; // No invoice product configured for this procedure type
  }

  if (!instance.encounterId) {
    return; // No encounter for procedure, so no invoice to add to
  }

  await instance.sequelize.models.Invoice.addItemToInvoice(
    instance,
    instance.encounterId,
    invoiceProduct,
    instance.physicianId,
  );
};

const removeFromInvoice = async (instance: Procedure) => {
  if (!instance.encounterId) {
    return; // No encounter for procedure, so no invoice to remove from
  }

  await instance.sequelize.models.Invoice.removeItemFromInvoice(instance, instance.encounterId);
};

const updateInvoiceProductAfterUpdateHook = async (instance: Procedure) => {
  const previousValues = instance.previous() as Procedure;
  await instance.sequelize.transaction(async () => {
    if (
      previousValues.procedureTypeId &&
      previousValues.procedureTypeId !== instance.procedureTypeId
    ) {
      // Ensure we remove the item from the invoice first, in case the new procedure type is not invoiceable
      await removeFromInvoice(instance);
    }

    await addToInvoice(instance);
  });
};

export const afterCreateHook = async (instance: Procedure) => {
  await addToInvoice(instance);
};

export const afterUpdateHook = async (instance: Procedure) => {
  await updateInvoiceProductAfterUpdateHook(instance);
};

export const afterDestroyHook = async (instance: Procedure) => {
  await removeFromInvoice(instance);
};
