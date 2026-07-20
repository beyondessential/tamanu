import config from 'config';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {
  ENCOUNTER_TYPES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { createTestContext } from '../utilities';

// A bed fee belongs to the bed's facility, so its overnight-check time (and timezone/rate) must be
// resolved from that facility — the same as the nightly BedFeeCharger and the PUT recompute. The
// admission (POST create) recompute previously read the settings from the *encounter's* facility,
// so admitting "at facility A" into a bed at facility B computed the admission night with A's
// settings until a later recompute corrected it. This regression pins the admission recompute to
// the bed's facility.
//
// Needs two server-configured facilities so req.settings resolves a reader for each: A is where the
// encounter is created, B is where the bed physically lives.
const serverFacilityIds = config.serverFacilityId
  ? [config.serverFacilityId]
  : config.serverFacilityIds ?? [];
const [encounterFacilityId, bedFacilityId] = serverFacilityIds;
const describeOrSkip = bedFacilityId ? describe : describe.skip;

describeOrSkip('Bed fee — admission uses the bed facility settings', () => {
  let ctx;
  let models;
  let app;
  let user;
  let bedLocation;
  let bedProduct;
  let department;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await ctx.baseApp.asUser(user);

    const [encounterFacility] = await models.Facility.findOrCreate({
      where: { id: encounterFacilityId },
      defaults: fake(models.Facility, { id: encounterFacilityId, name: 'Encounter facility' }),
    });
    await models.Facility.findOrCreate({
      where: { id: bedFacilityId },
      defaults: fake(models.Facility, { id: bedFacilityId, name: 'Bed facility' }),
    });

    department = await models.Department.create(
      fake(models.Department, { facilityId: encounterFacility.id, code: 'BEDFEE-XFAC-DEPT' }),
    );
    // The bed physically belongs to the *other* facility.
    bedLocation = await models.Location.create(
      fake(models.Location, { facilityId: bedFacilityId, code: 'BEDFEE-XFAC-BED' }),
    );
    bedProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: bedLocation.id,
      }),
    );

    await models.Setting.set('features.invoicing.enabled', true);
    // Different overnight-check times per facility so the same stay yields a different night count:
    // over 2024-06-18 10:00 → 2024-06-20 12:00, an 11:00 check crosses 3 nights and a 09:00 check 2.
    await models.Setting.set(
      'invoicing.bedFee.overnightChargeTime',
      '11:00',
      SETTINGS_SCOPES.FACILITY,
      encounterFacilityId,
    );
    await models.Setting.set(
      'invoicing.bedFee.overnightChargeTime',
      '09:00',
      SETTINGS_SCOPES.FACILITY,
      bedFacilityId,
    );
    settingsCache.reset();
  });

  afterAll(async () => {
    await models.Setting.set('features.invoicing.enabled', false);
    settingsCache.reset();
    await ctx.close();
  });

  it('bills the admission night with the bed facility overnight-check time, not the encounter facility', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    const result = await app.post('/api/encounter').send({
      facilityId: encounterFacilityId, // admitted "at" facility A...
      patientId: patient.id,
      examinerId: user.id,
      locationId: bedLocation.id, // ...into a bed that belongs to facility B
      departmentId: department.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2024-06-18 10:00:00',
      endDate: '2024-06-20 12:00:00',
    });
    expect(result).toHaveSucceeded();

    const invoiceResult = await app.get(`/api/encounter/${result.body.id}/invoice`);
    expect(invoiceResult).toHaveSucceeded();
    const bedLine = invoiceResult.body.items.find(item => item.productId === bedProduct.id);
    expect(bedLine).toBeDefined();
    // Bed facility B's 09:00 check → 2 nights; the encounter facility A's 11:00 check would give 3.
    expect(bedLine.quantity).toBe(2);
  });
});
