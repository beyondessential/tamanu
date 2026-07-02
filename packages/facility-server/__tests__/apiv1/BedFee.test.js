import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import config from 'config';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { ReadSettings } from '@tamanu/settings';
import {
  ENCOUNTER_TYPES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_STATUSES,
} from '@tamanu/constants';
import { createTestContext } from '../utilities';

// Model-level integration for the inpatient bed fee (TAM-6900): Invoice.recalculateBedFee charges
// one night per facility-local overnight check (min the admission night), per Location, and skips
// a location with no bed-fee product (e.g. an "open ward" placeholder).
describe('Bed fee (Invoice.recalculateBedFee)', () => {
  let ctx;
  let models;
  let patient;
  let user;
  let facility;
  let department;
  let bedLocation;
  let placeholderLocation;
  let bedProduct;
  let settings;
  let primaryTimeZone;

  const admitAndRecompute = async ({ locationId, startDate, endDate }) => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId,
      departmentId: department.id,
      examinerId: user.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate,
      endDate,
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: startDate,
      status: INVOICE_STATUSES.IN_PROGRESS,
    });
    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    return models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    primaryTimeZone = getPrimaryTimeZone(config);

    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    facility = await models.Facility.findOne({ order: [['createdAt', 'ASC']] });
    settings = new ReadSettings(models, facility.id);

    department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id, code: 'BED-DEPT' }),
    );
    bedLocation = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-LOC' }),
    );
    placeholderLocation = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-PLACEHOLDER' }),
    );

    // Bed-fee product for the real bed only; the placeholder ward has none.
    bedProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: bedLocation.id,
      }),
    );
    const priceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'Bed fee facility list',
        code: 'BED-FEE-PL',
        rules: { facilityId: facility.id },
      }),
    );
    await models.InvoicePriceListItem.create(
      fake(models.InvoicePriceListItem, {
        invoiceProductId: bedProduct.id,
        invoicePriceListId: priceList.id,
        price: 200,
        isHidden: false,
      }),
    );
  });

  afterAll(() => ctx.close());

  it('charges one night for a same-day admission', async () => {
    const items = await admitAndRecompute({
      locationId: bedLocation.id,
      startDate: '2024-06-16 09:00:00',
      endDate: '2024-06-16 14:00:00',
    });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(bedProduct.id);
    expect(items[0].quantity).toBe(1);
  });

  it('charges one night per overnight check for a multi-night stay', async () => {
    // Admitted Sun 18:00, discharged Wed 06:00 → 3 overnight (02:00) checks → 3 nights.
    const items = await admitAndRecompute({
      locationId: bedLocation.id,
      startDate: '2024-06-16 18:00:00',
      endDate: '2024-06-19 06:00:00',
    });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(bedProduct.id);
    expect(items[0].quantity).toBe(3);
  });

  it('does not charge a location with no bed-fee product (placeholder ward)', async () => {
    const items = await admitAndRecompute({
      locationId: placeholderLocation.id,
      startDate: '2024-06-16 18:00:00',
      endDate: '2024-06-19 06:00:00',
    });
    expect(items).toHaveLength(0);
  });

  it('bills per location when the patient changes ward mid-stay', async () => {
    const locationB = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-LOC-B' }),
    );
    const bedProductB = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: locationB.id,
      }),
    );

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId: bedLocation.id,
      departmentId: department.id,
      examinerId: user.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2024-06-16 18:00:00',
      endDate: '2024-06-19 06:00:00',
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: '2024-06-16 18:00:00',
      status: INVOICE_STATUSES.IN_PROGRESS,
    });

    // Location history: bed A from admission, moved to bed B mid-day on the 17th.
    await models.EncounterHistory.create(
      fake(models.EncounterHistory, {
        encounterId: encounter.id,
        locationId: bedLocation.id,
        departmentId: department.id,
        examinerId: user.id,
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        date: '2024-06-16 18:00:00',
      }),
    );
    await models.EncounterHistory.create(
      fake(models.EncounterHistory, {
        encounterId: encounter.id,
        locationId: locationB.id,
        departmentId: department.id,
        examinerId: user.id,
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        date: '2024-06-17 12:00:00',
      }),
    );

    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    const items = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
    const nightsByProduct = Object.fromEntries(items.map(item => [item.productId, item.quantity]));
    // Overnight (02:00) checks: 17th → bed A, 18th + 19th → bed B.
    expect(items).toHaveLength(2);
    expect(nightsByProduct[bedProduct.id]).toBe(1);
    expect(nightsByProduct[bedProductB.id]).toBe(2);
  });
});
