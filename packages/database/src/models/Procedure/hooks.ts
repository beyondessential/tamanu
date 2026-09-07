import { INVOICE_ITEMS_CATEGORIES, VISIBILITY_STATUSES } from '@tamanu/constants';
import type { Procedure } from './Procedure';

const addToInvoice = async (instance: Procedure) => {
  const invoiceProduct = await instance.sequelize.models.InvoiceProduct.findOne({
    where: {
      category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
      sourceRecordId: instance.procedureTypeId,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  });
  if (!invoiceProduct) {
    return; // No invoice product configured for this procedure type
  }

  if (!instance.encounterId) {
    return; // No encounter for procedure, so no invoice to add to
  }

  const supervisingClinicianId =
    instance.physicianId ??
    (
      await instance.sequelize.models.Encounter.findByPk(instance.encounterId, {
        attributes: ['examinerId'],
      })
    )?.examinerId;

  await instance.sequelize.models.Invoice.addItemToInvoice(
    instance,
    instance.encounterId,
    invoiceProduct,
    supervisingClinicianId ?? undefined,
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
  const updateInvoiceItem = async () => {
    if (
      previousValues.procedureTypeId &&
      previousValues.procedureTypeId !== instance.procedureTypeId
    ) {
      // Ensure we remove the item from the invoice first, in case the new procedure type is not invoiceable
      await removeFromInvoice(instance);
    }

    await addToInvoice(instance);
  };

  // sequelize.transaction() always opens a new connection rather than nesting as a savepoint
  // under an ambient CLS transaction, so calling it unconditionally here can deadlock against
  // a caller that already has a transaction open. Reuse the ambient transaction if present.
  if (instance.sequelize.isInsideTransaction()) {
    await updateInvoiceItem();
  } else {
    await instance.sequelize.transaction(updateInvoiceItem);
  }
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
