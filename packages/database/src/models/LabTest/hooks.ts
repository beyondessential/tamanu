import { INVOICE_ITEMS_CATEGORIES, INVOICEABLE_LAB_REQUEST_STATUSES } from '@tamanu/constants';
import type { LabTest } from './LabTest';

const addToInvoiceAfterCreateHook = async (instance: LabTest) => {
  const labRequest = await instance.sequelize.models.LabRequest.findByPk(instance.labRequestId);
  if (!labRequest || !labRequest.encounterId) {
    return;
  }

  if (!INVOICEABLE_LAB_REQUEST_STATUSES.includes(labRequest.status)) {
    return;
  }

  if (labRequest.labTestPanelRequestId) {
    const labTestPanelRequest = await instance.sequelize.models.LabTestPanelRequest.findByPk(
      labRequest.labTestPanelRequestId,
    );
    if (!labTestPanelRequest) {
      return;
    }

    const labTestPanelProduct = await instance.sequelize.models.InvoiceProduct.findOne({
      where: {
        category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL,
        sourceRecordId: labTestPanelRequest.labTestPanelId,
      },
    });
    if (labTestPanelProduct) {
      return; // There's a product for the panel, so no need to create invoice items for the individual tests
    }
  }

  const testProduct = await instance.sequelize.models.InvoiceProduct.findOne({
    where: {
      category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE,
      sourceRecordId: instance.labTestTypeId,
    },
  });
  if (!testProduct) {
    return;
  }

  await instance.sequelize.models.Invoice.addItemToInvoice(
    instance,
    labRequest.encounterId,
    testProduct,
    labRequest.requestedById,
  );
};

export const afterCreateHook = async (instance: LabTest) => {
  await addToInvoiceAfterCreateHook(instance);
};
