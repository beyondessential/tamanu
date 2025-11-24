import {
  IMAGING_REQUEST_STATUS_TYPES,
  NOTIFICATION_TYPES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICEABLE_IMAGING_REQUEST_STATUSES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import type { ImagingRequest } from './ImagingRequest';
import type { InstanceUpdateOptions } from 'sequelize';
import type { InvoiceProduct } from 'models/Invoice';

export const pushNotificationAfterUpdateHook = async (
  imagingRequest: ImagingRequest,
  options: InstanceUpdateOptions,
) => {
  const shouldPushNotification = [IMAGING_REQUEST_STATUS_TYPES.COMPLETED].includes(
    imagingRequest.status,
  );

  if (shouldPushNotification && imagingRequest.status !== imagingRequest.previous('status')) {
    await imagingRequest.sequelize.models.Notification.pushNotification(
      NOTIFICATION_TYPES.IMAGING_REQUEST,
      imagingRequest.dataValues,
      { transaction: options.transaction },
    );
  }

  const shouldDeleteNotification = [
    IMAGING_REQUEST_STATUS_TYPES.DELETED,
    IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
  ].includes(imagingRequest.status);

  if (shouldDeleteNotification && imagingRequest.status !== imagingRequest.previous('status')) {
    await imagingRequest.sequelize.models.Notification.destroy({
      where: {
        metadata: {
          id: imagingRequest.id,
        },
      },
      transaction: options.transaction,
    });
  }
};

const getItemsForImagingRequest = async (instance: ImagingRequest) => {
  const requestType = await instance.sequelize.models.ReferenceData.findOne({
    where: {
      type: REFERENCE_TYPES.IMAGING_TYPE,
      code: instance.imagingType,
    },
  });

  let requestTypeProduct: InvoiceProduct | null = null;
  if (requestType) {
    requestTypeProduct = await instance.sequelize.models.InvoiceProduct.findOne({
      where: {
        category: INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE,
        sourceRecordId: requestType.id,
      },
    });
  }

  const areas = await instance.sequelize.models.ImagingRequestArea.findAll({
    where: {
      imagingRequestId: instance.id,
    },
  });
  if (areas && areas.length > 0) {
    const areaItems = [];
    for (const area of areas) {
      const areaProduct = await instance.sequelize.models.InvoiceProduct.findOne({
        where: {
          category: INVOICE_ITEMS_CATEGORIES.IMAGING_AREA,
          sourceRecordId: area.areaId,
        },
      });
      if (areaProduct) {
        areaItems.push({ item: area, product: areaProduct, note: undefined });
      } else if (requestTypeProduct) {
        const areaRefData = await instance.sequelize.models.ReferenceData.findByPk(area.areaId);
        // Add note of area for reference
        areaItems.push({ item: area, product: requestTypeProduct, note: areaRefData?.name });
      }
    }
    return areaItems;
  }

  // No individual areas, so return a single item for the request type
  if (requestTypeProduct) {
    return [{ item: instance, product: requestTypeProduct, note: undefined }];
  }

  // No products configured for this request type or areas
  return [];
};

const addToInvoice = async (instance: ImagingRequest) => {
  if (!instance.encounterId) {
    return; // No encounter for procedure, so no invoice to add to
  }

  const products = await getItemsForImagingRequest(instance);
  for (const { item, product, note } of products) {
    await instance.sequelize.models.Invoice.addItemToInvoice(
      item,
      instance.encounterId,
      product,
      instance.requestedById,
      note,
    );
  }
};

const removeFromInvoice = async (instance: ImagingRequest) => {
  if (!instance.encounterId) {
    return; // No encounter for procedure, so no invoice to remove from
  }

  const items = await getItemsForImagingRequest(instance);
  for (const { item } of items) {
    await instance.sequelize.models.Invoice.removeItemFromInvoice(item, instance.encounterId);
  }
};

const addToInvoiceAfterCreateHook = async (instance: ImagingRequest) => {
  if (INVOICEABLE_IMAGING_REQUEST_STATUSES.includes(instance.status)) {
    await addToInvoice(instance);
  }
};

const addOrRemoveFromInvoiceAfterUpdateHook = async (instance: ImagingRequest) => {
  if (!INVOICEABLE_IMAGING_REQUEST_STATUSES.includes(instance.status) || instance.deletedAt) {
    await removeFromInvoice(instance);
  } else {
    await addToInvoice(instance);
  }
};

export const afterCreateHook = async (instance: ImagingRequest) => {
  await addToInvoiceAfterCreateHook(instance);
};

export const afterUpdateHook = async (
  imagingRequest: ImagingRequest,
  options: InstanceUpdateOptions,
) => {
  await Promise.all([
    pushNotificationAfterUpdateHook(imagingRequest, options),
    addOrRemoveFromInvoiceAfterUpdateHook(imagingRequest),
  ]);
};
