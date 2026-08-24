import { Op } from 'sequelize';
import { INVOICE_ITEMS_CATEGORIES } from '@tamanu/constants';
import { shouldAddLabRequestToInvoice } from '../LabRequest/hooks';
import type { LabTest } from './LabTest';

const addToInvoiceAfterCreateHook = async (instance: LabTest) => {
  const { LabRequest, LabTestPanelRequest, InvoiceProduct, InvoiceItem, Invoice } =
    instance.sequelize.models;

  const labRequest = await LabRequest.findByPk(instance.labRequestId);
  if (!labRequest || !labRequest.encounterId) {
    return;
  }

  if (!(await shouldAddLabRequestToInvoice(labRequest))) {
    return;
  }

  // A test attributed to a panel whose panel has an invoice product is covered by that panel, so
  // it is not billed individually.
  if (instance.labTestPanelRequestId) {
    const labTestPanelRequest = await LabTestPanelRequest.findByPk(instance.labTestPanelRequestId);
    const labTestPanelProduct = labTestPanelRequest
      ? await InvoiceProduct.findOne({
          where: {
            category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL,
            sourceRecordId: labTestPanelRequest.labTestPanelId,
          },
        })
      : null;
    if (labTestPanelProduct) {
      return;
    }
  }

  const testProduct = await InvoiceProduct.findOne({
    where: {
      category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE,
      sourceRecordId: instance.labTestTypeId,
    },
  });
  if (!testProduct) {
    return;
  }

  // A test type is billed once per request, however many panels contributed a row for it, so skip
  // if a sibling test of the same type on this request is already invoiced.
  const siblingTests = await instance.sequelize.models.LabTest.findAll({
    where: {
      labRequestId: instance.labRequestId,
      labTestTypeId: instance.labTestTypeId,
      id: { [Op.ne]: instance.id },
    },
    attributes: ['id'],
  });
  if (siblingTests.length) {
    const alreadyBilled = await InvoiceItem.findOne({
      where: {
        sourceRecordType: instance.getModelName(),
        sourceRecordId: siblingTests.map(test => test.id),
      },
    });
    if (alreadyBilled) {
      return;
    }
  }

  await Invoice.addItemToInvoice(
    instance,
    labRequest.encounterId,
    testProduct,
    labRequest.requestedById,
  );
};

export const afterCreateHook = async (instance: LabTest) => {
  await addToInvoiceAfterCreateHook(instance);
};
