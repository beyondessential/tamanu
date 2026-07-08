import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { sub } from 'date-fns';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';
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
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { createTestContext } from '../utilities';

// Integration for inpatient fee inclusions/exclusions (TAM-6901): a facility that bundles a
// category into the admission fee doesn't auto-add those items for admission encounters (but
// still does for outpatient/ER). For medications, only the administered (MAR) portion is
// excluded — discharge dispensing is always billed.
describe('Inpatient fee inclusions', () => {
  let ctx;
  let models;
  let app;
  let user;
  let patient;
  let facility;
  let location;
  let labPanel;
  let drug;

  const createEncounterWithInvoice = async encounterType => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId: location.id,
      encounterType,
      endDate: null,
    });
    await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: new Date(),
      status: INVOICE_STATUSES.IN_PROGRESS,
    });
    return encounter;
  };

  // Create a lab request for the panel, move it to an invoiceable status, return the invoice items.
  const requestLabAndGetItems = async encounter => {
    const {
      body: [labRequest],
    } = await app.post('/api/labRequest').send({
      encounterId: encounter.id,
      panelIds: [labPanel.id],
      sampleDetails: { [labPanel.id]: { sampleTime: new Date() } },
      requestedById: user.id,
      date: new Date(),
    });
    await app.put(`/api/labRequest/${labRequest.id}`).send({
      status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
      userId: user.id,
    });
    const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
    expect(result).toHaveSucceeded();
    return result.body.items ?? [];
  };

  // Create an imaging request, move it to an invoiceable status, return the invoice items.
  const requestImagingAndGetItems = async encounter => {
    const { body: imagingRequest } = await app.post('/api/imagingRequest').send({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: user.id,
    });
    await app.put(`/api/imagingRequest/${imagingRequest.id}`).send({
      status: IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS,
    });
    const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
    expect(result).toHaveSucceeded();
    return result.body.items ?? [];
  };

  // Admission with an administered dose (MAR) and a discharge pharmacy order, return invoice items.
  const admissionMedicationItems = async ({ administered, dispensed }) => {
    const encounter = await createEncounterWithInvoice(ENCOUNTER_TYPES.ADMISSION);
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
    await app.post('/api/medication/medication-administration-record/given').send({
      prescriptionId: prescription.id,
      dose: { doseAmount: administered, givenTime: toDateTimeString(sub(new Date(), { days: 10 })) },
      dueAt: toDateTimeString(sub(new Date(), { days: 10 })),
    });
    await app.post(`/api/encounter/${encounter.id}/pharmacyOrder`).send({
      orderingClinicianId: user.id,
      date: toDateTimeString(sub(new Date(), { days: 5 })),
      isDischargePrescription: true,
      pharmacyOrderPrescriptions: [{ prescriptionId: prescription.id, quantity: dispensed }],
      facilityId: facility.id,
    });
    const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
    expect(result).toHaveSucceeded();
    return result.body.items ?? [];
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await ctx.baseApp.asUser(user);

    facility = await models.Facility.findOne({ order: [['createdAt', 'ASC']] });
    location = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'INC-EXC-LOC' }),
    );

    // Lab product
    const labCategory = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'labTestCategory', code: 'INC-EXC-CAT' }),
    );
    const labType = await models.LabTestType.create(
      fake(models.LabTestType, { code: 'INC-EXC-BLOODS', labTestCategoryId: labCategory.id }),
    );
    labPanel = await models.LabTestPanel.create(fake(models.LabTestPanel, { code: 'INC-EXC-PANEL' }));
    await models.LabTestPanelLabTestTypes.create({
      labTestPanelId: labPanel.id,
      labTestTypeId: labType.id,
    });
    const panelProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL],
        sourceRecordId: labPanel.id,
      }),
    );

    // Drug product
    drug = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG, code: 'INC-EXC-DRUG' }),
    );
    const drugProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.DRUG,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.DRUG],
        sourceRecordId: drug.id,
      }),
    );

    // Imaging product
    const [imagingType] = await models.ReferenceData.findOrCreate({
      where: { type: REFERENCE_TYPES.IMAGING_TYPE, code: IMAGING_TYPES.CT_SCAN },
      defaults: fake(models.ReferenceData, {
        type: REFERENCE_TYPES.IMAGING_TYPE,
        code: IMAGING_TYPES.CT_SCAN,
      }),
    });
    const imagingProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE],
        sourceRecordId: imagingType.id,
      }),
    );

    const priceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'Inclusions facility list',
        code: 'INC-EXC-PL',
        rules: { facilityId: facility.id },
      }),
    );
    for (const product of [panelProduct, drugProduct, imagingProduct]) {
      await models.InvoicePriceListItem.create(
        fake(models.InvoicePriceListItem, {
          invoiceProductId: product.id,
          invoicePriceListId: priceList.id,
          price: 100,
          isHidden: false,
        }),
      );
    }

    await models.Setting.set('features.invoicing.enabled', true);
    // This facility bundles imaging, lab and medication into the admission fee.
    await models.Setting.set(
      'invoicing.inpatientFee.bundledCategories',
      ['imaging', 'lab', 'medication'],
      SETTINGS_SCOPES.FACILITY,
      facility.id,
    );
  });

  afterAll(async () => {
    await models.Setting.set('features.invoicing.enabled', false);
    await ctx.close();
  });

  it('does not auto-add lab items for an admission encounter when lab is bundled', async () => {
    const encounter = await createEncounterWithInvoice(ENCOUNTER_TYPES.ADMISSION);
    const items = await requestLabAndGetItems(encounter);
    expect(items).toHaveLength(0);
  });

  it('still auto-adds lab items for a non-admission (clinic) encounter', async () => {
    const encounter = await createEncounterWithInvoice(ENCOUNTER_TYPES.CLINIC);
    const items = await requestLabAndGetItems(encounter);
    expect(items).toHaveLength(1);
  });

  it('does not auto-add imaging items for an admission encounter when imaging is bundled', async () => {
    const encounter = await createEncounterWithInvoice(ENCOUNTER_TYPES.ADMISSION);
    const items = await requestImagingAndGetItems(encounter);
    expect(items).toHaveLength(0);
  });

  it('still auto-adds imaging items for a non-admission (clinic) encounter', async () => {
    const encounter = await createEncounterWithInvoice(ENCOUNTER_TYPES.CLINIC);
    const items = await requestImagingAndGetItems(encounter);
    expect(items).toHaveLength(1);
  });

  it('excludes administered medications but keeps discharge dispensing when medications are bundled', async () => {
    const items = await admissionMedicationItems({ administered: 5, dispensed: 10 });
    expect(items).toHaveLength(1);
    // administered (5) excluded by bundling; discharge dispensing (10) still billed
    expect(items[0].quantity).toBe(10);
  });
});
