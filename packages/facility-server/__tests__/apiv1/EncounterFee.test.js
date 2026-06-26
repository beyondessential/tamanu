import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import config from 'config';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { ReadSettings } from '@tamanu/settings';
import {
  ENCOUNTER_TYPES,
  ENCOUNTER_FEE_CODES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_STATUSES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { createTestContext } from '../utilities';

// Model-level integration for the encounter fee (TAM-6898): Invoice.addEncounterFee picks the
// bucket by encounter family + facility-local start time, resolves the reference-data-backed
// product, and skips when the encounter's department price list hides the fee product.
describe('Encounter fee (Invoice.addEncounterFee)', () => {
  let ctx;
  let models;
  let patient;
  let user;
  let facility;
  let location;
  let generalDepartment;
  let pharmacyDepartment;
  let standardProduct;
  let edProduct;
  let facilityPriceList;
  let settings;
  let primaryTimeZone;

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

  const priceListItem = async (priceListId, productId, { price = 50, isHidden = false } = {}) =>
    models.InvoicePriceListItem.create(
      fake(models.InvoicePriceListItem, {
        invoiceProductId: productId,
        invoicePriceListId: priceListId,
        price,
        isHidden,
      }),
    );

  const createEncounterWithInvoice = async ({
    encounterType = ENCOUNTER_TYPES.CLINIC,
    departmentId,
    startDate = '2024-06-18 10:00:00', // Tuesday, standard hours
  } = {}) => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId: location.id,
      departmentId: departmentId ?? generalDepartment.id,
      examinerId: user.id,
      encounterType,
      startDate,
      endDate: startDate,
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: startDate,
      status: INVOICE_STATUSES.IN_PROGRESS,
    });
    return { encounter, invoice };
  };

  // Create an encounter + its in-progress invoice, run addEncounterFee, and return the line items.
  const addFeeFor = async (opts = {}) => {
    const { encounter, invoice } = await createEncounterWithInvoice(opts);
    await models.Invoice.addEncounterFee(encounter, settings, primaryTimeZone);
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

    location = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'ENC-FEE-LOC' }),
    );
    generalDepartment = await models.Department.create(
      fake(models.Department, { facilityId: facility.id, code: 'ENC-FEE-GENERAL' }),
    );
    pharmacyDepartment = await models.Department.create(
      fake(models.Department, { facilityId: facility.id, code: 'ENC-FEE-PHARMACY' }),
    );

    standardProduct = await createFeeProduct(ENCOUNTER_FEE_CODES.STANDARD);
    edProduct = await createFeeProduct(ENCOUNTER_FEE_CODES.EMERGENCY);

    facilityPriceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'Encounter fee facility list',
        code: 'ENC-FEE-FACILITY',
        rules: { facilityId: facility.id },
      }),
    );
    await priceListItem(facilityPriceList.id, standardProduct.id);
    await priceListItem(facilityPriceList.id, edProduct.id, { price: 80 });
  });

  afterAll(() => ctx.close());

  it('adds the standard-hours fee to a weekday clinic encounter', async () => {
    const items = await addFeeFor({ encounterType: ENCOUNTER_TYPES.CLINIC });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(standardProduct.id);
  });

  it('adds the single ED fee to a triage encounter', async () => {
    const items = await addFeeFor({ encounterType: ENCOUNTER_TYPES.TRIAGE });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(edProduct.id);
  });

  it('adds no fee for an encounter type that is not invoiceable', async () => {
    const items = await addFeeFor({ encounterType: ENCOUNTER_TYPES.ADMISSION });
    expect(items).toHaveLength(0);
  });

  it('is idempotent — a second call for the same encounter does not add a duplicate fee line', async () => {
    const { encounter, invoice } = await createEncounterWithInvoice();
    await models.Invoice.addEncounterFee(encounter, settings, primaryTimeZone);
    await models.Invoice.addEncounterFee(encounter, settings, primaryTimeZone);
    const items = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(standardProduct.id);
  });

  it('does not re-add a fee line that was removed (soft-deleted) by a cashier', async () => {
    const { encounter, invoice } = await createEncounterWithInvoice();
    await models.Invoice.addEncounterFee(encounter, settings, primaryTimeZone);
    const [feeLine] = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
    await feeLine.destroy(); // cashier removes the fee

    await models.Invoice.addEncounterFee(encounter, settings, primaryTimeZone);
    const liveItems = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
    expect(liveItems).toHaveLength(0);
  });

  it('skips the fee when the department price list hides the fee product, but charges other departments', async () => {
    const pharmacyPriceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'Pharmacy department list',
        code: 'ENC-FEE-PHARMACY-PL',
        rules: { facilityId: facility.id, departmentId: pharmacyDepartment.id },
        evaluationOrder: 1, // wins over the facility-wide list for the pharmacy department
      }),
    );
    await priceListItem(pharmacyPriceList.id, standardProduct.id, { price: 0, isHidden: true });

    const pharmacyItems = await addFeeFor({ departmentId: pharmacyDepartment.id });
    expect(pharmacyItems).toHaveLength(0);

    const generalItems = await addFeeFor({ departmentId: generalDepartment.id });
    expect(generalItems).toHaveLength(1);
    expect(generalItems[0].productId).toBe(standardProduct.id);
  });
});
