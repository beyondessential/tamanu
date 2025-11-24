import {
  INVOICE_ITEMS_CATEGORIES,
  LAB_REQUEST_STATUSES,
  NOTIFICATION_TYPES,
  INVOICEABLE_LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import type { LabRequest } from './LabRequest';
import type { InstanceUpdateOptions } from 'sequelize';

export const pushNotificationAfterUpdateHook = async (
  labRequest: LabRequest,
  options: InstanceUpdateOptions,
) => {
  const shouldPushNotification = [
    LAB_REQUEST_STATUSES.INTERIM_RESULTS,
    LAB_REQUEST_STATUSES.PUBLISHED,
    LAB_REQUEST_STATUSES.INVALIDATED,
  ].includes(labRequest.status);

  if (shouldPushNotification && labRequest.status !== labRequest.previous('status')) {
    await labRequest.sequelize.models.Notification.pushNotification(
      NOTIFICATION_TYPES.LAB_REQUEST,
      labRequest.dataValues,
      { transaction: options.transaction },
    );
  }

  const shouldDeleteNotification = [
    LAB_REQUEST_STATUSES.DELETED,
    LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
  ].includes(labRequest.status);

  if (shouldDeleteNotification && labRequest.status !== labRequest.previous('status')) {
    await labRequest.sequelize.models.Notification.destroy({
      where: {
        metadata: {
          id: labRequest.id,
        },
      },
      transaction: options.transaction,
    });
  }
};

const getItemsForLabRequest = async (instance: LabRequest) => {
  if (instance.labTestPanelRequestId) {
    const labTestPanelRequest = await instance.sequelize.models.LabTestPanelRequest.findByPk(
      instance.labTestPanelRequestId,
    );
    if (labTestPanelRequest) {
      const panelProduct = await instance.sequelize.models.InvoiceProduct.findOne({
        where: {
          category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL,
          sourceRecordId: labTestPanelRequest.labTestPanelId,
        },
      });

      if (panelProduct) {
        return [{ item: labTestPanelRequest, product: panelProduct }];
      }
    }
  }

  const tests = await instance.getTests();
  const testItems = [];
  for (const test of tests) {
    const invoiceProduct = await instance.sequelize.models.InvoiceProduct.findOne({
      where: {
        category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE,
        sourceRecordId: test.labTestTypeId,
      },
    });

    if (invoiceProduct) {
      testItems.push({ item: test, product: invoiceProduct });
    }
  }

  return testItems;
};

const addToInvoice = async (instance: LabRequest) => {
  if (!instance.encounterId) {
    return; // No encounter for procedure, so no invoice to add to
  }

  const products = await getItemsForLabRequest(instance);
  for (const { item, product } of products) {
    await instance.sequelize.models.Invoice.addItemToInvoice(
      item,
      instance.encounterId,
      product,
      instance.requestedById,
    );
  }
};

const removeFromInvoice = async (instance: LabRequest) => {
  if (!instance.encounterId) {
    return; // No encounter for procedure, so no invoice to remove from
  }

  const items = await getItemsForLabRequest(instance);
  for (const { item } of items) {
    await instance.sequelize.models.Invoice.removeItemFromInvoice(item, instance.encounterId);
  }
};

const addToInvoiceAfterCreateHook = async (instance: LabRequest) => {
  if (INVOICEABLE_LAB_REQUEST_STATUSES.includes(instance.status)) {
    await addToInvoice(instance);
  }
};

const addOrRemoveFromInvoiceAfterUpdateHook = async (instance: LabRequest) => {
  if (INVOICEABLE_LAB_REQUEST_STATUSES.includes(instance.status)) {
    await addToInvoice(instance);
  } else {
    await removeFromInvoice(instance);
  }
};

const removeFromInvoiceAfterDestroyHook = async (instance: LabRequest) => {
  await removeFromInvoice(instance);
};

export const afterCreateHook = async (instance: LabRequest) => {
  await addToInvoiceAfterCreateHook(instance);
};

export const afterUpdateHook = async (labRequest: LabRequest, options: InstanceUpdateOptions) => {
  await Promise.all([
    pushNotificationAfterUpdateHook(labRequest, options),
    addOrRemoveFromInvoiceAfterUpdateHook(labRequest),
  ]);
};

export const afterDestroyHook = async (instance: LabRequest) => {
  await removeFromInvoiceAfterDestroyHook(instance);
};
