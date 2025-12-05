import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import {
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

      it('should automatically add reception_pending items to the invoice when the clinicEncounterLabAndImagingRequests setting is enabled', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          encounterType: ENCOUNTER_TYPES.CLINIC,
          patientId: patient.id,
        });
        await models.Setting.set('features.invoicing.clinicEncounterLabAndImagingRequests', true);
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

      it('should automatically add pending items to the invoice when the clinicEncounterLabAndImagingRequests setting is enabled', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId: patient.id,
          encounterType: ENCOUNTER_TYPES.CLINIC,
        });
        await models.Setting.set('features.invoicing.clinicEncounterLabAndImagingRequests', true);
        await models.Invoice.create({
          encounterId: encounter.id,
          displayId: 'INV-123',
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

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
      });
    });
  });

  describe('Insurance plan items', () => {
    it('should include insurance plan items with default coverage for invoice items', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        locationId: location.id,
        patientId: patient.id,
      });

      // Create insurance plan with default coverage
      const insurancePlan = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-001',
        name: 'Basic Plan',
        defaultCoverage: 80,
      });

      // Create invoice and link insurance plan
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-456',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      await models.InvoicesInvoiceInsurancePlan.create({
        invoiceId: invoice.id,
        invoiceInsurancePlanId: insurancePlan.id,
      });

      // Create procedure and invoice product
      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Procedure 2',
          code: 'PROC-2',
        }),
      );

      const invoiceProduct = await models.InvoiceProduct.create(
        fake(models.InvoiceProduct, {
          category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
          sourceRecordType:
            INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE],
          sourceRecordId: procedureType.id,
        }),
      );
      await createPriceListItemForProduct(models, invoiceProduct.id, priceList.id);

      const procedure = await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: encounter.id,
          procedureTypeId: procedureType.id,
          date: new Date(),
          physicianId: user.id,
        }),
      );

      const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
      expect(result).toHaveSucceeded();
      expect(result.body.items).toHaveLength(1);
      expect(result.body.items[0]).toMatchObject({
        sourceRecordId: procedure.id,
        productId: invoiceProduct.id,
        insurancePlanItems: [
          {
            id: insurancePlan.id,
            code: 'PLAN-001',
            name: 'Basic Plan',
            label: 'Basic Plan',
            coverageValue: '80',
          },
        ],
      });
    });

    it('should include insurance plan items with custom coverage values', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        locationId: location.id,
        patientId: patient.id,
      });

      // Create insurance plan
      const insurancePlan = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-002',
        name: 'Premium Plan',
        defaultCoverage: 90,
      });

      // Create invoice and link insurance plan
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-789',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      await models.InvoicesInvoiceInsurancePlan.create({
        invoiceId: invoice.id,
        invoiceInsurancePlanId: insurancePlan.id,
      });

      // Create procedure and invoice product
      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Procedure 3',
          code: 'PROC-3',
        }),
      );

      const invoiceProduct = await models.InvoiceProduct.create(
        fake(models.InvoiceProduct, {
          category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
          sourceRecordType:
            INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE],
          sourceRecordId: procedureType.id,
        }),
      );
      await createPriceListItemForProduct(models, invoiceProduct.id, priceList.id);

      // Create custom coverage for this specific product
      await models.InvoiceInsurancePlanItem.create({
        invoiceInsurancePlanId: insurancePlan.id,
        invoiceProductId: invoiceProduct.id,
        coverageValue: 95,
      });

      const procedure = await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: encounter.id,
          procedureTypeId: procedureType.id,
          date: new Date(),
          physicianId: user.id,
        }),
      );

      const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
      expect(result).toHaveSucceeded();
      expect(result.body.items).toHaveLength(1);
      expect(result.body.items[0]).toMatchObject({
        sourceRecordId: procedure.id,
        productId: invoiceProduct.id,
        insurancePlanItems: [
          {
            id: insurancePlan.id,
            code: 'PLAN-002',
            name: 'Premium Plan',
            label: 'Premium Plan',
            coverageValue: '95', // Should use custom coverage instead of default
          },
        ],
      });
    });

    it('should include multiple insurance plans for a single invoice', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        locationId: location.id,
        patientId: patient.id,
      });

      // Create multiple insurance plans
      const insurancePlan1 = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-PRIMARY',
        name: 'Primary Insurance',
        defaultCoverage: 80,
      });

      const insurancePlan2 = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-SECONDARY',
        name: 'Secondary Insurance',
        defaultCoverage: 50,
      });

      // Create invoice and link both insurance plans
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-999',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      await models.InvoicesInvoiceInsurancePlan.create({
        invoiceId: invoice.id,
        invoiceInsurancePlanId: insurancePlan1.id,
      });

      await models.InvoicesInvoiceInsurancePlan.create({
        invoiceId: invoice.id,
        invoiceInsurancePlanId: insurancePlan2.id,
      });

      // Create procedure and invoice product
      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Procedure 4',
          code: 'PROC-4',
        }),
      );

      const invoiceProduct = await models.InvoiceProduct.create(
        fake(models.InvoiceProduct, {
          category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
          sourceRecordType:
            INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE],
          sourceRecordId: procedureType.id,
        }),
      );
      await createPriceListItemForProduct(models, invoiceProduct.id, priceList.id);

      // Create custom coverage for second plan only
      await models.InvoiceInsurancePlanItem.create({
        invoiceInsurancePlanId: insurancePlan2.id,
        invoiceProductId: invoiceProduct.id,
        coverageValue: 60,
      });

      await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: encounter.id,
          procedureTypeId: procedureType.id,
          date: new Date(),
          physicianId: user.id,
        }),
      );

      const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
      expect(result).toHaveSucceeded();
      expect(result.body.items).toHaveLength(1);
      expect(result.body.items[0].insurancePlanItems).toHaveLength(2);

      // Check both insurance plans are present
      const insurancePlanItems = result.body.items[0].insurancePlanItems;
      const primaryPlan = insurancePlanItems.find(item => item.code === 'PLAN-PRIMARY');
      const secondaryPlan = insurancePlanItems.find(item => item.code === 'PLAN-SECONDARY');

      expect(primaryPlan).toMatchObject({
        id: insurancePlan1.id,
        code: 'PLAN-PRIMARY',
        name: 'Primary Insurance',
        label: 'Primary Insurance',
        coverageValue: '80', // Default coverage
      });

      expect(secondaryPlan).toMatchObject({
        id: insurancePlan2.id,
        code: 'PLAN-SECONDARY',
        name: 'Secondary Insurance',
        label: 'Secondary Insurance',
        coverageValue: '60', // Custom coverage
      });
    });
  });
});
