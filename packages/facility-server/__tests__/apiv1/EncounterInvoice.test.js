import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { sub } from 'date-fns';
import { createTestContext } from '../utilities';
import {
  ADMINISTRATION_FREQUENCIES,
  ENCOUNTER_TYPES,
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TYPES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_STATUSES,
  LAB_REQUEST_STATUSES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { describe } from 'node:test';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';

async function createPriceListItemForProduct(
  models,
  invoiceProductId,
  invoicePriceListId,
  price = 100,
) {
  return await models.InvoicePriceListItem.create(
    fake(models.InvoicePriceListItem, {
      invoiceProductId,
      invoicePriceListId,
      price,
      isHidden: false,
    }),
  );
}

describe('Encounter invoice', () => {
  let patient = null;
  let user = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let facility = null;
  let location = null;
  let priceList = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await baseApp.asUser(user);

    facility = await models.Facility.findOne({
      order: [['createdAt', 'ASC']],
    });
    location = await models.Location.create(
      fake(models.Location, {
        facilityId: facility.id,
        name: 'Location Invoice Test',
        code: 'LOCATION-INVOICE-TEST',
      }),
    );
    priceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'Facility Price List',
        code: 'FACILITY',
        rules: {
          facilityId: facility.id,
        },
      }),
    );
  });

  beforeEach(async () => {
    await models.Encounter.truncate();
    await models.Invoice.truncate();
    await models.InvoiceItem.truncate();
    await models.InvoicesInvoiceInsurancePlan.truncate();
    await models.InvoiceInsurancePlanItem.truncate();
  });

  afterAll(() => ctx.close());

  describe('GET encounter invoice', () => {
    it('should get the invoice for an encounter', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });
      await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-123',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });
      const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        displayId: 'INV-123',
        encounterId: encounter.id,
        status: INVOICE_STATUSES.IN_PROGRESS,
        items: [],
      });
    });
  });

  describe('Automatically added items', () => {
    describe('Procedure', () => {
      let procedureType1;
      let procedureType2;
      let procedureType3;
      let procedureProduct1;
      let procedureProduct2;
      let priceListItem1;

      beforeAll(async () => {
        procedureType1 = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.PROCEDURE_TYPE,
            name: 'Procedure 1',
            code: 'PROC-1',
          }),
        );
        procedureType2 = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.PROCEDURE_TYPE,
            name: 'Procedure 2',
            code: 'PROC-2',
          }),
        );
        procedureType3 = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.PROCEDURE_TYPE,
            name: 'Procedure 3',
            code: 'PROC-3',
          }),
        );
        procedureProduct1 = await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, {
            category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
            sourceRecordType:
              INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE],
            sourceRecordId: procedureType1.id,
          }),
        );
        procedureProduct2 = await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, {
            category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
            sourceRecordType:
              INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE],
            sourceRecordId: procedureType2.id,
          }),
        );
        priceListItem1 = await createPriceListItemForProduct(
          models,
          procedureProduct1.id,
          priceList.id,
        );
        await createPriceListItemForProduct(models, procedureProduct2.id, priceList.id);
      });

      // Although this test uses a procedure type, this same logic applies to all possible InvoiceItemSourceRecord
      it('should NOT automatically add items to the invoice when a procedure is created if the price list item is hidden', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        try {
          await priceListItem1.update({ isHidden: true });

          await app.post(`/api/procedure`).send({
            encounterId: encounter.id,
            procedureTypeId: procedureType1.id,
            date: new Date(),
            physicianId: user.id,
          });

          const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
          expect(result).toHaveSucceeded();
          expect(result.body).toMatchObject({
            displayId: 'INV-123',
            encounterId: encounter.id,
            status: INVOICE_STATUSES.IN_PROGRESS,
            items: [],
          });
          expect(result.body.items).toHaveLength(0);
        } finally {
          await priceListItem1.update({ isHidden: false });
        }
      });

      // Although this test uses a procedure type, this same logic applies to all possible InvoiceItemSourceRecord
      it('should automatically add items to the invoice when a procedure is created even if the price list item has a null price', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        try {
          await priceListItem1.update({ price: null });

          const { body: procedure } = await app.post(`/api/procedure`).send({
            encounterId: encounter.id,
            procedureTypeId: procedureType1.id,
            date: new Date(),
            physicianId: user.id,
          });

          const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
          expect(result).toHaveSucceeded();
          expect(result.body).toMatchObject({
            displayId: 'INV-123',
            encounterId: encounter.id,
            status: INVOICE_STATUSES.IN_PROGRESS,
            items: [
              {
                sourceRecordId: procedure.id,
                sourceRecordType: 'Procedure',
                productId: procedureProduct1.id,
                orderedByUserId: user.id,
                quantity: 1,
                insurancePlanItems: [],
              },
            ],
          });
        } finally {
          await priceListItem1.update({ price: 100 });
        }
      });

      it('should automatically add items to the invoice when a procedure is created', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        const { body: procedure } = await app.post(`/api/procedure`).send({
          encounterId: encounter.id,
          procedureTypeId: procedureType1.id,
          date: new Date(),
          physicianId: user.id,
        });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [
            {
              sourceRecordId: procedure.id,
              sourceRecordType: 'Procedure',
              productId: procedureProduct1.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            },
          ],
        });
      });

      it('should automatically update items on the invoice when a procedure type changes', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        const { body: procedure } = await app.post(`/api/procedure`).send({
          encounterId: encounter.id,
          procedureTypeId: procedureType1.id,
          date: new Date(),
          physicianId: user.id,
        });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [
            {
              sourceRecordId: procedure.id,
              sourceRecordType: 'Procedure',
              productId: procedureProduct1.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            },
          ],
        });

        await app.put(`/api/procedure/${procedure.id}`).send({
          procedureTypeId: procedureType2.id,
        });

        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2).toHaveSucceeded();
        expect(result2.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [
            {
              sourceRecordId: procedure.id,
              sourceRecordType: 'Procedure',
              productId: procedureProduct2.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            },
          ],
        });

        // Switching to a procedure type that does not have an invoice product should remove the item from the invoice
        await app.put(`/api/procedure/${procedure.id}`).send({
          procedureTypeId: procedureType3.id,
        });

        const result3 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result3).toHaveSucceeded();
        expect(result3.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });
      });
    });

    describe('Lab request', () => {
      let labTestCategory;
      let labTestBloodsProduct;
      let labTestBloodsType;
      let labTestFluProduct;
      let labTestFluType;
      let labTestHeartType;
      let labTestPanelGeneralProduct;
      let labTestPanelGeneral;
      let labTestPanelAll;

      beforeAll(async () => {
        labTestCategory = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
            name: 'General',
            code: 'GENERAL',
          }),
        );
        labTestPanelGeneral = await models.LabTestPanel.create(
          fake(models.LabTestPanel, {
            name: 'General',
            code: 'GENERAL',
          }),
        );
        labTestBloodsType = await models.LabTestType.create(
          fake(models.LabTestType, {
            name: 'Bloods',
            code: 'BLOODS',
            labTestCategoryId: labTestCategory.id,
          }),
        );
        labTestBloodsProduct = await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, {
            category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE,
            sourceRecordType:
              INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE],
            sourceRecordId: labTestBloodsType.id,
          }),
        );
        await createPriceListItemForProduct(models, labTestBloodsProduct.id, priceList.id);
        labTestFluType = await models.LabTestType.create(
          fake(models.LabTestType, {
            name: 'Flu',
            code: 'FLU',
            labTestCategoryId: labTestCategory.id,
          }),
        );
        labTestFluProduct = await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, {
            category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE,
            sourceRecordType:
              INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE],
            sourceRecordId: labTestFluType.id,
          }),
        );
        await createPriceListItemForProduct(models, labTestFluProduct.id, priceList.id);
        labTestHeartType = await models.LabTestType.create(
          fake(models.LabTestType, {
            name: 'Heart',
            code: 'HEART',
            labTestCategoryId: labTestCategory.id,
          }),
        );
        labTestPanelGeneralProduct = await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, {
            category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL,
            sourceRecordType:
              INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL],
            sourceRecordId: labTestPanelGeneral.id,
          }),
        );
        await createPriceListItemForProduct(models, labTestPanelGeneralProduct.id, priceList.id);
        labTestPanelAll = await models.LabTestPanel.create(
          fake(models.LabTestPanel, {
            name: 'All',
            code: 'ALL',
          }),
        );

        // Bloods and Flu are part of the general panel
        await models.LabTestPanelLabTestTypes.create({
          labTestPanelId: labTestPanelGeneral.id,
          labTestTypeId: labTestBloodsType.id,
        });
        await models.LabTestPanelLabTestTypes.create({
          labTestPanelId: labTestPanelGeneral.id,
          labTestTypeId: labTestFluType.id,
        });

        // All tests are part of the All panel
        await models.LabTestPanelLabTestTypes.create({
          labTestPanelId: labTestPanelAll.id,
          labTestTypeId: labTestBloodsType.id,
        });
        await models.LabTestPanelLabTestTypes.create({
          labTestPanelId: labTestPanelAll.id,
          labTestTypeId: labTestFluType.id,
        });
        await models.LabTestPanelLabTestTypes.create({
          labTestPanelId: labTestPanelAll.id,
          labTestTypeId: labTestHeartType.id,
        });
      });

      it('should automatically add/remove the panel product to the invoice when a lab request is created/deleted', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        const {
          body: [labRequest],
        } = await app.post(`/api/labRequest`).send({
          encounterId: encounter.id,
          panelIds: [labTestPanelGeneral.id],
          sampleDetails: {
            [labTestPanelGeneral.id]: {
              sampleTime: new Date(),
            },
          },
          requestedById: user.id,
          date: new Date(),
        });

        // Not added initially as RECEPTION_PENDING status is not invoiceable
        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });

        // Setting status to an invoiceable status automatically adds it to the invoice
        await app.put(`/api/labRequest/${labRequest.id}`).send({
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
          userId: user.id,
        });

        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        });
        expect(result2.body.items).toHaveLength(1);
        expect(result2.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceRecordId: labRequest.labTestPanelRequestId,
              sourceRecordType: 'LabTestPanelRequest',
              productId: labTestPanelGeneralProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
          ]),
        );

        // Cancelling the request should remove the items from the invoice
        await app.put(`/api/labRequest/${labRequest.id}`).send({
          status: LAB_REQUEST_STATUSES.CANCELLED,
          userId: user.id,
        });

        const result3 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result3).toHaveSucceeded();
        expect(result3.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });
      });

      it('should automatically add/remove the test products to the invoice when a lab request is created/deleted', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        const {
          body: [labRequest],
        } = await app.post(`/api/labRequest`).send({
          encounterId: encounter.id,
          labTestTypeIds: [labTestBloodsType.id, labTestFluType.id],
          sampleDetails: {
            [labTestCategory.id]: {
              sampleTime: new Date(),
            },
          },
          requestedById: user.id,
          date: new Date(),
        });

        const labTestBloods = await models.LabTest.findOne({
          where: {
            labTestTypeId: labTestBloodsType.id,
            labRequestId: labRequest.id,
          },
        });
        const labTestFlu = await models.LabTest.findOne({
          where: {
            labTestTypeId: labTestFluType.id,
            labRequestId: labRequest.id,
          },
        });

        // Not added initially as RECEPTION_PENDING status is not invoiceable
        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });

        // Setting status to an invoiceable status automatically adds it to the invoice
        await app.put(`/api/labRequest/${labRequest.id}`).send({
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
          userId: user.id,
        });

        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2).toHaveSucceeded();
        expect(result2.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        });
        expect(result2.body.items).toHaveLength(2);
        expect(result2.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceRecordId: labTestBloods.id,
              sourceRecordType: labTestBloods.getModelName(),
              productId: labTestBloodsProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
            expect.objectContaining({
              sourceRecordId: labTestFlu.id,
              sourceRecordType: labTestFlu.getModelName(),
              productId: labTestFluProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
          ]),
        );

        // Cancelling the request should remove the items from the invoice
        await app.put(`/api/labRequest/${labRequest.id}`).send({
          status: LAB_REQUEST_STATUSES.CANCELLED,
          userId: user.id,
        });

        const result3 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result3).toHaveSucceeded();
        expect(result3.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });
      });

      it('should automatically add/remove the test products to the invoice when a product is not configured for the panel', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        const {
          body: [labRequest],
        } = await app.post(`/api/labRequest`).send({
          encounterId: encounter.id,
          panelIds: [labTestPanelAll.id],
          sampleDetails: {
            [labTestPanelAll.id]: {
              sampleTime: new Date(),
            },
          },
          requestedById: user.id,
          date: new Date(),
        });

        const labTestBloods = await models.LabTest.findOne({
          where: {
            labTestTypeId: labTestBloodsType.id,
            labRequestId: labRequest.id,
          },
        });
        const labTestFlu = await models.LabTest.findOne({
          where: {
            labTestTypeId: labTestFluType.id,
            labRequestId: labRequest.id,
          },
        });

        // Not added initially as RECEPTION_PENDING status is not invoiceable
        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });

        // Setting status to an invoiceable status automatically adds it to the invoice
        await app.put(`/api/labRequest/${labRequest.id}`).send({
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
          userId: user.id,
        });

        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2).toHaveSucceeded();
        expect(result2.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        });
        expect(result2.body.items).toHaveLength(2);
        expect(result2.body.items).toEqual(
          expect.arrayContaining([
            // No product for Heart, so its not on the invoice
            expect.objectContaining({
              sourceRecordId: labTestBloods.id,
              sourceRecordType: labTestBloods.getModelName(),
              productId: labTestBloodsProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
            expect.objectContaining({
              sourceRecordId: labTestFlu.id,
              sourceRecordType: labTestFlu.getModelName(),
              productId: labTestFluProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
          ]),
        );

        // Cancelling the request should remove the items from the invoice
        await app.put(`/api/labRequest/${labRequest.id}`).send({
          status: LAB_REQUEST_STATUSES.CANCELLED,
          userId: user.id,
        });

        const result3 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result3).toHaveSucceeded();
        expect(result3.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });
      });

      it('should automatically add reception_pending items to the invoice when the invoicePendingLabRequests setting is enabled', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          encounterType: ENCOUNTER_TYPES.CLINIC,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        try {
          await models.Setting.set('features.invoicing.invoicePendingLabRequests', true);
          const {
            body: [labRequest],
          } = await app.post(`/api/labRequest`).send({
            encounterId: encounter.id,
            panelIds: [labTestPanelGeneral.id],
            sampleDetails: {
              [labTestPanelGeneral.id]: {
                sampleTime: new Date(),
              },
            },
            requestedById: user.id,
            date: new Date(),
          });

          expect(labRequest.status).toEqual(LAB_REQUEST_STATUSES.RECEPTION_PENDING);
          const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
          expect(result).toHaveSucceeded();
          expect(result.body).toMatchObject({
            displayId: 'INV-123',
            encounterId: encounter.id,
          });
          expect(result.body.items).toHaveLength(1);
          expect(result.body.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                sourceRecordId: labRequest.labTestPanelRequestId,
                sourceRecordType: 'LabTestPanelRequest',
                productId: labTestPanelGeneralProduct.id,
                orderedByUserId: user.id,
                quantity: 1,
                insurancePlanItems: [],
              }),
            ]),
          );
        } finally {
          await models.Setting.set('features.invoicing.invoicePendingLabRequests', false);
        }
      });
    });

    describe('Imaging request', () => {
      let imagingRequestProduct;
      let imagingAreaHeadProduct;
      let imagingAreaHead;
      let imagingAreaFoot;

      beforeAll(async () => {
        const imagingType = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.IMAGING_TYPE,
            name: 'xRay',
            code: IMAGING_TYPES.X_RAY,
          }),
        );
        imagingAreaHead = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.X_RAY_IMAGING_AREA,
            name: 'xRay - Head',
            code: 'xRay - Head',
          }),
        );
        imagingAreaFoot = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.X_RAY_IMAGING_AREA,
            name: 'xRay - Foot',
            code: 'xRay - Foot',
          }),
        );
        imagingRequestProduct = await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, {
            category: INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE,
            sourceRecordType:
              INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE],
            sourceRecordId: imagingType.id,
          }),
        );
        await createPriceListItemForProduct(models, imagingRequestProduct.id, priceList.id);
        imagingAreaHeadProduct = await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, {
            category: INVOICE_ITEMS_CATEGORIES.IMAGING_AREA,
            sourceRecordType:
              INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.IMAGING_AREA],
            sourceRecordId: imagingAreaHead.id,
          }),
        );
        await createPriceListItemForProduct(models, imagingAreaHeadProduct.id, priceList.id);
      });

      it('should automatically add/remove items to the invoice when an imaging request is created/deleted', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        const { body: imagingRequest } = await app.post(`/api/imagingRequest`).send({
          encounterId: encounter.id,
          imagingType: IMAGING_TYPES.X_RAY,
          status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
          date: new Date(),
          requestedById: user.id,
          areas: JSON.stringify([imagingAreaHead.id, imagingAreaFoot.id]),
        });

        const imagingRequestAreaHead = await models.ImagingRequestArea.findOne({
          where: {
            imagingRequestId: imagingRequest.id,
            areaId: imagingAreaHead.id,
          },
        });
        const imagingRequestAreaFoot = await models.ImagingRequestArea.findOne({
          where: {
            imagingRequestId: imagingRequest.id,
            areaId: imagingAreaFoot.id,
          },
        });

        // Initially no items added as PENDING is not an invoiceable status
        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });

        // Setting the status to IN_PROGRESS should automatically add to the invoice
        await app.put(`/api/imagingRequest/${imagingRequest.id}`).send({
          status: IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS,
        });

        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2).toHaveSucceeded();
        expect(result2.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        });
        expect(result2.body.items).toHaveLength(2);
        expect(result2.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceRecordId: imagingRequestAreaHead.id,
              sourceRecordType: imagingRequestAreaHead.getModelName(),
              productId: imagingAreaHeadProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
            expect.objectContaining({
              sourceRecordId: imagingRequestAreaFoot.id,
              sourceRecordType: imagingRequestAreaFoot.getModelName(),
              productId: imagingRequestProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
          ]),
        );

        // Cancelling the request should remove the items from the invoice
        await app.put(`/api/imagingRequest/${imagingRequest.id}`).send({
          status: IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
        });

        const result3 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result3).toHaveSucceeded();
        expect(result3.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });
      });

      it('should not automatically add/remove items to the invoice when the transaction is rolled back', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        try {
          await models.ImagingRequest.sequelize.transaction(async () => {
            const imagingRequest = await models.ImagingRequest.create(
              fake(models.ImagingRequest, {
                encounterId: encounter.id,
                imagingType: IMAGING_TYPES.X_RAY,
                status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
                date: new Date(),
                requestedById: user.id,
              }),
            );
            await models.ImagingRequestArea.create(
              fake(models.ImagingRequestArea, {
                imagingRequestId: imagingRequest.id,
                areaId: imagingAreaHead.id,
              }),
            );
            await models.ImagingRequestArea.create(
              fake(models.ImagingRequestArea, {
                imagingRequestId: imagingRequest.id,
                areaId: imagingAreaFoot.id,
              }),
            );
            throw new Error('Test error');
          });
        } catch (error) {
          // ignore error
        }

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });

        const { body: imagingRequest } = await app.post(`/api/imagingRequest`).send({
          encounterId: encounter.id,
          imagingType: IMAGING_TYPES.X_RAY,
          status: IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS,
          date: new Date(),
          requestedById: user.id,
          areas: JSON.stringify([imagingAreaHead.id, imagingAreaFoot.id]),
        });

        const imagingRequestAreaHead = await models.ImagingRequestArea.findOne({
          where: {
            imagingRequestId: imagingRequest.id,
            areaId: imagingAreaHead.id,
          },
        });
        const imagingRequestAreaFoot = await models.ImagingRequestArea.findOne({
          where: {
            imagingRequestId: imagingRequest.id,
            areaId: imagingAreaFoot.id,
          },
        });

        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2).toHaveSucceeded();
        expect(result2.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        });
        expect(result2.body.items).toHaveLength(2);
        expect(result2.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceRecordId: imagingRequestAreaHead.id,
              sourceRecordType: imagingRequestAreaHead.getModelName(),
              productId: imagingAreaHeadProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
            expect.objectContaining({
              sourceRecordId: imagingRequestAreaFoot.id,
              sourceRecordType: imagingRequestAreaFoot.getModelName(),
              productId: imagingRequestProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
          ]),
        );

        try {
          await models.ImagingRequest.sequelize.transaction(async () => {
            await models.ImagingRequest.update(
              {
                status: IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
              },
              {
                where: {
                  id: imagingRequest.id,
                },
              },
            );
            throw new Error('Test error');
          });
        } catch (error) {
          // ignore error
        }

        const result3 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result3.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        });
        expect(result3.body.items).toHaveLength(2);
        expect(result3.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceRecordId: imagingRequestAreaHead.id,
              sourceRecordType: imagingRequestAreaHead.getModelName(),
              productId: imagingAreaHeadProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
            expect.objectContaining({
              sourceRecordId: imagingRequestAreaFoot.id,
              sourceRecordType: imagingRequestAreaFoot.getModelName(),
              productId: imagingRequestProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
          ]),
        );
      });

      it('should automatically add pending items to the invoice when the invoicePendingImagingRequests setting is enabled', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
          encounterType: ENCOUNTER_TYPES.CLINIC,
        });
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        try {
          await models.Setting.set('features.invoicing.invoicePendingImagingRequests', true);
          const { body: imagingRequest } = await app.post(`/api/imagingRequest`).send({
            encounterId: encounter.id,
            imagingType: IMAGING_TYPES.X_RAY,
            date: new Date(),
            requestedById: user.id,
            areas: JSON.stringify([imagingAreaHead.id, imagingAreaFoot.id]),
          });

          const imagingRequestAreaHead = await models.ImagingRequestArea.findOne({
            where: {
              imagingRequestId: imagingRequest.id,
              areaId: imagingAreaHead.id,
            },
          });
          const imagingRequestAreaFoot = await models.ImagingRequestArea.findOne({
            where: {
              imagingRequestId: imagingRequest.id,
              areaId: imagingAreaFoot.id,
            },
          });

          expect(imagingRequest.status).toEqual(IMAGING_REQUEST_STATUS_TYPES.PENDING);
          const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
          expect(result).toHaveSucceeded();
          expect(result.body).toMatchObject({
            displayId: 'INV-123',
            encounterId: encounter.id,
            status: INVOICE_STATUSES.IN_PROGRESS,
          });
          expect(result.body.items).toHaveLength(2);
          expect(result.body.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                sourceRecordId: imagingRequestAreaHead.id,
                sourceRecordType: imagingRequestAreaHead.getModelName(),
                productId: imagingAreaHeadProduct.id,
                orderedByUserId: user.id,
                quantity: 1,
                insurancePlanItems: [],
              }),
              expect.objectContaining({
                sourceRecordId: imagingRequestAreaFoot.id,
                sourceRecordType: imagingRequestAreaFoot.getModelName(),
                productId: imagingRequestProduct.id,
                orderedByUserId: user.id,
                quantity: 1,
                insurancePlanItems: [],
              }),
            ]),
          );
        } finally {
          await models.Setting.set('features.invoicing.invoicePendingImagingRequests', false);
        }
      });
    });

    describe('Medications', () => {
      let notGivenReason;
      let drug;
      let drugProduct;

      async function createEncounterPrescription(encounterType = ENCOUNTER_TYPES.ADMISSION) {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          encounterType,
          endDate: null,
          patientId: patient.id,
        });

        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

        const { body: prescription } = await app
          .post(`/api/medication/encounterPrescription/${encounter.id}`)
          .send({
            medicationId: drug.id,
            prescriberId: user.id,
            doseAmount: 1,
            units: 'mg',
            frequency: ADMINISTRATION_FREQUENCIES.IMMEDIATELY,
            route: 'dermal',
            date: '2025-01-01',
            startDate: getCurrentDateTimeString(),
          });

        return { encounter, prescription };
      }

      beforeAll(async () => {
        notGivenReason = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.MEDICATION_NOT_GIVEN_REASON,
            name: 'Not given reason',
            code: 'not-given-reason',
          }),
        );
        drug = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.DRUG,
            name: 'Drug 1',
            code: 'drug1',
          }),
        );
        drugProduct = await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, {
            category: INVOICE_ITEMS_CATEGORIES.DRUG,
            sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.DRUG],
            sourceRecordId: drug.id,
          }),
        );
      });

      it('should automatically add/remove items to the invoice when a medication is administered', async () => {
        const { encounter, prescription } = await createEncounterPrescription();

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [], // No items initially until they're administered
        });

        // Administer the medication
        const { body: medicationAdministrationRecord } = await app
          .post(`/api/medication/medication-administration-record/given`)
          .send({
            prescriptionId: prescription.id,
            dose: {
              doseAmount: 1,
              givenTime: getCurrentDateTimeString(),
            },
            dueAt: getCurrentDateTimeString(),
          });

        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2).toHaveSucceeded();
        expect(result2.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        });
        expect(result2.body.items).toHaveLength(1);
        expect(result2.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceRecordId: prescription.id,
              sourceRecordType: 'Prescription',
              productId: drugProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
          ]),
        );

        // Switching the MAR to not given should remove the item from the invoice
        await app
          .put(
            `/api/medication/medication-administration-record/${medicationAdministrationRecord.id}/not-given`,
          )
          .send({
            dueAt: getCurrentDateTimeString(),
            prescriptionId: prescription.id,
            reasonNotGivenId: notGivenReason.id,
          });

        const result3 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result3).toHaveSucceeded();
        expect(result3.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });
      });

      it('should add a single invoice item as long as there is at least one MAR that is given', async () => {
        const { encounter, prescription } = await createEncounterPrescription();

        // Administer the medication twice
        const { body: medicationAdministrationRecord } = await app
          .post(`/api/medication/medication-administration-record/given`)
          .send({
            prescriptionId: prescription.id,
            dose: {
              doseAmount: 1,
              givenTime: getCurrentDateTimeString(),
            },
            dueAt: getCurrentDateTimeString(),
          });

        await app.post(`/api/medication/medication-administration-record/given`).send({
          prescriptionId: prescription.id,
          dose: {
            doseAmount: 1,
            givenTime: getCurrentDateTimeString(),
          },
          dueAt: getCurrentDateTimeString(),
        });

        // Just one item despite two MARs being administered
        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        });
        expect(result.body.items).toHaveLength(1);
        expect(result.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceRecordId: prescription.id,
              sourceRecordType: 'Prescription',
              productId: drugProduct.id,
              orderedByUserId: user.id,
              quantity: 2,
              insurancePlanItems: [],
            }),
          ]),
        );

        // Switching first MAR to not given should not remove the item from the invoice, as the other is still given
        await app
          .put(
            `/api/medication/medication-administration-record/${medicationAdministrationRecord.id}/not-given`,
          )
          .send({
            dueAt: getCurrentDateTimeString(),
            prescriptionId: prescription.id,
            reasonNotGivenId: notGivenReason.id,
          });

        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2).toHaveSucceeded();
        expect(result2.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        });
        expect(result2.body.items).toHaveLength(1);
        expect(result2.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceRecordId: prescription.id,
              sourceRecordType: 'Prescription',
              productId: drugProduct.id,
              orderedByUserId: user.id,
              quantity: 1,
              insurancePlanItems: [],
            }),
          ]),
        );
      });

      it('should not add items for an encounter type that is not invoiceable', async () => {
        const { encounter, prescription } = await createEncounterPrescription(
          ENCOUNTER_TYPES.VACCINATION,
        );

        await app.post(`/api/medication/medication-administration-record/given`).send({
          prescriptionId: prescription.id,
          dose: {
            doseAmount: 1,
            givenTime: getCurrentDateTimeString(),
          },
          dueAt: getCurrentDateTimeString(),
        });

        // No items should be added for an encounter type that is not invoiceable
        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          displayId: 'INV-123',
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
          items: [],
        });
      });

      it('should automatically add/remove items to the invoice when a pharmacy order is created', async () => {
        const { encounter, prescription } = await createEncounterPrescription();

        // Create a pharmacy order
        const { body: pharmacyOrder } = await app
          .post(`/api/encounter/${encounter.id}/pharmacyOrder`)
          .send({
            orderingClinicianId: user.id,
            date: getCurrentDateTimeString(),
            pharmacyOrderPrescriptions: [
              {
                prescriptionId: prescription.id,
                quantity: 10,
              },
            ],
            facilityId: facility.id,
          });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body.items).toHaveLength(1);
        expect(result.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceRecordId: prescription.id,
              quantity: 10,
            }),
          ]),
        );

        // Delete the pharmacy order prescription
        const pops = await models.PharmacyOrderPrescription.findAll({
          where: { pharmacyOrderId: pharmacyOrder.id },
        });
        const popId = pops[0].id;
        await app.delete(`/api/medication/medication-requests/${popId}`);

        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2).toHaveSucceeded();
        expect(result2.body.items).toHaveLength(0);
      });

      it('should update the invoice when a pharmacy order prescription is updated', async () => {
        const { encounter, prescription } = await createEncounterPrescription();

        const { body: pharmacyOrder } = await app
          .post(`/api/encounter/${encounter.id}/pharmacyOrder`)
          .send({
            orderingClinicianId: user.id,
            date: getCurrentDateTimeString(),
            pharmacyOrderPrescriptions: [
              {
                prescriptionId: prescription.id,
                quantity: 10,
              },
            ],
            facilityId: facility.id,
          });

        const pops = await models.PharmacyOrderPrescription.findAll({
          where: { pharmacyOrderId: pharmacyOrder.id },
        });
        const popId = pops[0].id;
        await models.PharmacyOrderPrescription.update({ quantity: 20 }, { where: { id: popId } });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body.items).toHaveLength(1);
        expect(result.body.items[0]).toMatchObject({
          sourceRecordId: prescription.id,
          quantity: 20,
        });
      });

      it('should combine MAR and Pharmacy Order Prescription quantities correctly', async () => {
        const { encounter, prescription } = await createEncounterPrescription();

        // 1. Administer a dose (MAR)
        await app.post(`/api/medication/medication-administration-record/given`).send({
          prescriptionId: prescription.id,
          dose: {
            doseAmount: 5,
            givenTime: toDateTimeString(sub(new Date(), { days: 2 })),
          },
          dueAt: toDateTimeString(sub(new Date(), { days: 2 })),
        });

        // 2. Create a Pharmacy Order (later than MAR)
        await app.post(`/api/encounter/${encounter.id}/pharmacyOrder`).send({
          orderingClinicianId: user.id,
          date: toDateTimeString(sub(new Date(), { days: 1 })),
          pharmacyOrderPrescriptions: [
            {
              prescriptionId: prescription.id,
              quantity: 10,
            },
          ],
          facilityId: facility.id,
        });

        // Total should be 5 (MAR) + 10 (POP) = 15
        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result).toHaveSucceeded();
        expect(result.body.items).toHaveLength(1);
        expect(result.body.items[0]).toMatchObject({
          sourceRecordId: prescription.id,
          quantity: 15,
        });

        // 3. Administer another dose (MAR) AFTER the Pharmacy Order date
        await app.post(`/api/medication/medication-administration-record/given`).send({
          prescriptionId: prescription.id,
          dose: {
            doseAmount: 7,
            givenTime: getCurrentDateTimeString(),
          },
          dueAt: getCurrentDateTimeString(),
        });

        // Total should still be 15 because the second dose is after the pharmacy order
        const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
        expect(result2).toHaveSucceeded();
        expect(result2.body.items[0].quantity).toBe(15);
      });
    });
  });
});
