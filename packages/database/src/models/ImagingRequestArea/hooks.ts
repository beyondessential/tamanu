import { INVOICE_ITEMS_CATEGORIES, REFERENCE_TYPES } from '@tamanu/constants';
import type { ImagingRequestArea } from './ImagingRequestArea';
import type { ImagingRequest } from 'models/ImagingRequest';
import { shouldAddImagingRequestToInvoice } from '../ImagingRequest/hooks';

const addItemAsAreaProduct = async (
  instance: ImagingRequestArea,
  imagingRequest: ImagingRequest,
) => {
  if (!imagingRequest.encounterId) {
    return false;
  }

  if (!instance.areaId) {
    return false;
  }

  const areaProduct = await instance.sequelize.models.InvoiceProduct.findOne({
    where: {
      category: INVOICE_ITEMS_CATEGORIES.IMAGING_AREA,
      sourceRecordId: instance.areaId,
    },
  });

  if (areaProduct) {
    await instance.sequelize.models.Invoice.addItemToInvoice(
      instance,
      imagingRequest.encounterId,
      areaProduct,
      imagingRequest.requestedById,
    );
    return true;
  }

  return false;
};

const addItemAsRequestTypeProduct = async (
  instance: ImagingRequestArea,
  imagingRequest: ImagingRequest,
) => {
  if (!imagingRequest.encounterId) {
    return false;
  }

  const requestType = await instance.sequelize.models.ReferenceData.findOne({
    where: {
      type: REFERENCE_TYPES.IMAGING_TYPE,
      code: imagingRequest.imagingType,
    },
  });
  if (!requestType) {
    return false;
  }

  const requestTypeProduct = await instance.sequelize.models.InvoiceProduct.findOne({
    where: {
      category: INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE,
      sourceRecordId: requestType.id,
    },
  });
  if (!requestTypeProduct) {
    return;
  }

  const areaRefData = await instance.sequelize.models.ReferenceData.findByPk(instance.areaId);
  // Add note of area for reference
  await instance.sequelize.models.Invoice.addItemToInvoice(
    instance,
    imagingRequest.encounterId,
    requestTypeProduct,
    imagingRequest.requestedById,
    { note: areaRefData?.name },
  );
};

const addToInvoice = async (instance: ImagingRequestArea) => {
  const imagingRequest = await instance.sequelize.models.ImagingRequest.findByPk(
    instance.imagingRequestId,
  );
  if (!imagingRequest || !imagingRequest.encounterId) {
    return;
  }

  if (!(await shouldAddImagingRequestToInvoice(imagingRequest))) {
    return;
  }

  // Remove the existing imaging request item from the invoice as now we're tracking the items by their areas
  await instance.sequelize.models.Invoice.removeItemFromInvoice(
    imagingRequest,
    imagingRequest.encounterId,
  );

  if (await addItemAsAreaProduct(instance, imagingRequest)) {
    return;
  }

  await addItemAsRequestTypeProduct(instance, imagingRequest);
};

const removeFromInvoice = async (instance: ImagingRequestArea) => {
  const imagingRequest = await instance.sequelize.models.ImagingRequest.findByPk(
    instance.imagingRequestId,
  );
  if (!imagingRequest || !imagingRequest.encounterId) {
    return;
  }

  await instance.sequelize.models.Invoice.removeItemFromInvoice(
    instance,
    imagingRequest.encounterId,
  );
};

export const afterCreateHook = async (instance: ImagingRequestArea) => {
  await addToInvoice(instance);
};

export const afterUpdateHook = async (instance: ImagingRequestArea) => {
  if (instance.deletedAt) {
    await removeFromInvoice(instance);
  } else {
    await addToInvoice(instance);
  }
};
