import config from 'config';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {
  ENCOUNTER_TYPES,
  ENCOUNTER_FEE_CODES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { createTestContext } from '../utilities';

// The invoice auto-create in the encounter route reads settings via req.settings[facilityId],
// which is only keyed for the server's configured facilities. A developer's local.json5 can
// override serverFacilityIds, so resolve the id from config rather than hard-coding it.
const [configuredFacilityId] = config.serverFacilityId
  ? [config.serverFacilityId]
  : config.serverFacilityIds;

// End-to-end (HTTP route) coverage for the encounter/bed fees added at the invoice auto-create
// chokepoint: the admitted-from-ED journey, the invoicing-disabled gate, and a $0-priced fee line.
// These exercise the wiring in encounter.js (POST create + PUT update) that the model-level
// EncounterFee/BedFee suites don't reach.
describe('Encounter & bed fees end-to-end (encounter routes)', () => {
  let ctx;
  let models;
  let app;
  let user;
  let facility;
  let edLocation;
  let wardLocation;
  let department;
  let edProduct;
  let standardProduct;
  let bedProduct;

  const freshPatient = async () => models.Patient.create(await createDummyPatient(models));

  const createFeeProduct = async code => {
    const referenceData = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.ENCOUNTER_FEE, code }),
    );
    return models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.ENCOUNTER_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.ENCOUNTER_FEE],
        sourceRecordId: referenceData.id,
      }),
    );
  };

  const priceProduct = (priceListId, productId, price) =>
    models.InvoicePriceListItem.create(
      fake(models.InvoicePriceListItem, {
        invoiceProductId: productId,
        invoicePriceListId: priceListId,
        price,
        isHidden: false,
      }),
    );

  const invoiceItemsFor = async encounterId => {
    const result = await app.get(`/api/encounter/${encounterId}/invoice`);
    if (!result.ok) return null;
    return result.body.items ?? [];
  };

  const createEncounter = async (body) => {
    const result = await app.post('/api/encounter').send({ facilityId: facility.id, ...body });
    expect(result).toHaveSucceeded();
    return result.body;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await ctx.baseApp.asUser(user);

    // Must be the server's configured facility so req.settings[facilityId] resolves a settings
    // reader — the route's invoice auto-create reads the invoicing flag through it.
    [facility] = await models.Facility.findOrCreate({
      where: { id: configuredFacilityId },
      defaults: fake(models.Facility, { id: configuredFacilityId, name: 'E2E fee facility' }),
    });
    edLocation = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'E2E-ED-BED' }),
    );
    wardLocation = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'E2E-WARD-BED' }),
    );
    department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id, code: 'E2E-DEPT' }),
    );

    edProduct = await createFeeProduct(ENCOUNTER_FEE_CODES.EMERGENCY_STANDARD);
    standardProduct = await createFeeProduct(ENCOUNTER_FEE_CODES.STANDARD);
    bedProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: wardLocation.id,
      }),
    );

    const priceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'E2E fee facility list',
        code: 'E2E-FEE-PL',
        rules: { facilityId: facility.id },
      }),
    );
    await priceProduct(priceList.id, edProduct.id, 150);
    await priceProduct(priceList.id, standardProduct.id, 0); // $0 line case
    await priceProduct(priceList.id, bedProduct.id, 200);

    await models.Setting.set('features.invoicing.enabled', true);
    settingsCache.reset();
  });

  afterAll(async () => {
    await models.Setting.set('features.invoicing.enabled', false);
    settingsCache.reset();
    await ctx.close();
  });

  it('adds the ED fee to a triage encounter created via the route', async () => {
    const patient = await freshPatient();
    const encounter = await createEncounter({
      patientId: patient.id,
      examinerId: user.id,
      locationId: edLocation.id,
      departmentId: department.id,
      encounterType: ENCOUNTER_TYPES.TRIAGE,
      startDate: '2024-06-18 10:00:00',
    });
    const items = await invoiceItemsFor(encounter.id);
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(edProduct.id);
  });

  it('keeps the ED fee and adds a bed-fee night when admitted from ED to a ward', async () => {
    const patient = await freshPatient();
    const encounter = await createEncounter({
      patientId: patient.id,
      examinerId: user.id,
      locationId: edLocation.id,
      departmentId: department.id,
      encounterType: ENCOUNTER_TYPES.TRIAGE,
      startDate: '2024-06-18 10:00:00', // Tue in-hours ED triage → ED standard fee added at create
    });

    // Admit from ED to a ward bed. submittedTime dates the ward move so the overnight (02:00)
    // checks fall while the patient occupies the ward; the closed endDate bounds the stay to two
    // nights. The location change fires the PUT bed-fee recompute guard.
    const put = await app.put(`/api/encounter/${encounter.id}`).send({
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      locationId: wardLocation.id,
      submittedTime: '2024-06-18 12:00:00',
      endDate: '2024-06-20 09:00:00',
    });
    expect(put).toHaveSucceeded();

    const items = await invoiceItemsFor(encounter.id);
    const bedLine = items.find(i => i.productId === bedProduct.id);
    expect(items.map(i => i.productId)).toContain(edProduct.id); // ED fee remains
    expect(bedLine).toBeDefined(); // bed-fee nights charged for the ward stay
    expect(bedLine.quantity).toBe(2); // 02:00 checks on the 19th and 20th
  });

  // Admitting a patient in place — changing encounterType to ADMISSION with no location change —
  // still recomputes the bed fee: the PUT recompute guard fires on an encounterType change
  // (packages/facility-server/app/routes/apiv1/encounter.js), so the admission night is charged
  // immediately rather than waiting for a later ward move, discharge, or the nightly BedFeeCharger.
  it('charges a bed fee when admitted in place (encounterType change, same location)', async () => {
    const patient = await freshPatient();
    const encounter = await createEncounter({
      patientId: patient.id,
      examinerId: user.id,
      locationId: wardLocation.id, // ward has a bed-fee product
      departmentId: department.id,
      encounterType: ENCOUNTER_TYPES.TRIAGE,
      startDate: '2024-06-18 10:00:00',
    });

    // Admit in place: only the encounter type changes — no locationId, endDate, or discharge.
    const put = await app.put(`/api/encounter/${encounter.id}`).send({
      encounterType: ENCOUNTER_TYPES.ADMISSION,
    });
    expect(put).toHaveSucceeded();

    const items = await invoiceItemsFor(encounter.id);
    const bedLine = items.find(i => i.productId === bedProduct.id);
    expect(bedLine).toBeDefined();
  });

  it('creates a $0 fee line for a fee product priced at zero (not omitted)', async () => {
    const patient = await freshPatient();
    const encounter = await createEncounter({
      patientId: patient.id,
      examinerId: user.id,
      locationId: wardLocation.id,
      departmentId: department.id,
      encounterType: ENCOUNTER_TYPES.CLINIC,
      startDate: '2024-06-18 10:00:00', // Tuesday, standard hours → standard product ($0)
      endDate: '2024-06-18 12:00:00',
    });
    const items = await invoiceItemsFor(encounter.id);
    const standardLine = items.find(i => i.productId === standardProduct.id);
    expect(standardLine).toBeDefined();
  });

  it('creates no invoice or fee when invoicing is disabled globally', async () => {
    await models.Setting.set('features.invoicing.enabled', false);
    settingsCache.reset();
    try {
      const patient = await freshPatient();
      const encounter = await createEncounter({
        patientId: patient.id,
        examinerId: user.id,
        locationId: edLocation.id,
        departmentId: department.id,
        encounterType: ENCOUNTER_TYPES.TRIAGE,
        startDate: '2024-06-18 10:00:00',
        endDate: '2024-06-18 12:00:00',
      });
      const invoice = await models.Invoice.findOne({ where: { encounterId: encounter.id } });
      expect(invoice).toBeNull();
    } finally {
      await models.Setting.set('features.invoicing.enabled', true);
      settingsCache.reset();
    }
  });
});
