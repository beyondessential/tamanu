import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {
  ENCOUNTER_TYPES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_STATUSES,
  LAB_REQUEST_STATUSES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { createTestContext } from '../utilities';

// Integration for inpatient fee inclusions/exclusions (TAM-6901): when a facility bundles `lab`
// into the admission fee, lab items don't auto-add for admission encounters but still do for
// outpatient/ER.
describe('Inpatient fee inclusions', () => {
  let ctx;
  let models;
  let app;
  let user;
  let patient;
  let facility;
  let location;
  let labPanel;

  const createEncounterWithInvoice = async encounterType => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId: location.id,
      encounterType,
    });
    await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: new Date(),
      status: INVOICE_STATUSES.IN_PROGRESS,
    });
    return encounter;
  };

  // Create a lab request for the panel and move it to an invoiceable status, then return the
  // encounter's invoice line items.
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

    const labCategory = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'labTestCategory', code: 'INC-EXC-CAT' }),
    );
    const labType = await models.LabTestType.create(
      fake(models.LabTestType, { code: 'INC-EXC-BLOODS', labTestCategoryId: labCategory.id }),
    );
    labPanel = await models.LabTestPanel.create(
      fake(models.LabTestPanel, { code: 'INC-EXC-PANEL' }),
    );
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
    const priceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'Inclusions facility list',
        code: 'INC-EXC-PL',
        rules: { facilityId: facility.id },
      }),
    );
    await models.InvoicePriceListItem.create(
      fake(models.InvoicePriceListItem, {
        invoiceProductId: panelProduct.id,
        invoicePriceListId: priceList.id,
        price: 100,
        isHidden: false,
      }),
    );

    await models.Setting.set('features.invoicing.enabled', true);
    // This facility bundles lab into the admission fee.
    await models.Setting.set(
      'invoicing.inpatientFee.bundledCategories',
      ['lab'],
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
});
