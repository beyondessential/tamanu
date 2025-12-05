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

const addOrRemoveFromInvoiceAfterUpdateHook = async (instance: Procedure) => {
  if (!instance.deletedAt) {
    await addToInvoice(instance);
  } else {
    await removeFromInvoice(instance);
  }
};

export const afterCreateHook = async (instance: Procedure) => {
  await addToInvoice(instance);
};

export const afterUpdateHook = async (instance: Procedure) => {
  await addOrRemoveFromInvoiceAfterUpdateHook(instance);
};

export const afterDestroyHook = async (instance: Procedure) => {
  await removeFromInvoice(instance);
};
