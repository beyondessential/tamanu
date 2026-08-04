import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { ReadSettings, settingsCache } from '@tamanu/settings';
import {
  ENCOUNTER_TYPES,
  ENCOUNTER_FEE_CODES,
  PHARMACY_ENCOUNTER_FEE_CODE,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_STATUSES,
  REFERENCE_TYPES,
  SETTINGS_SCOPES,
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
  let edAfterHoursProduct;
  let edWeekendProduct;
  let pharmacyProduct;
  let facilityPriceList;
  let settings;
  let primaryTimeZone;

  const createFeeProduct = async (
    code,
    {
      referenceType = REFERENCE_TYPES.ENCOUNTER_FEE,
      category = INVOICE_ITEMS_CATEGORIES.ENCOUNTER_FEE,
    } = {},
  ) => {
    const referenceData = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: referenceType, code }),
    );
    return models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[category],
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
    primaryTimeZone = getPrimaryTimeZone();

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
    edProduct = await createFeeProduct(ENCOUNTER_FEE_CODES.EMERGENCY_STANDARD);
    edAfterHoursProduct = await createFeeProduct(ENCOUNTER_FEE_CODES.EMERGENCY_AFTER_HOURS);
    edWeekendProduct = await createFeeProduct(ENCOUNTER_FEE_CODES.EMERGENCY_WEEKEND);
    pharmacyProduct = await createFeeProduct(PHARMACY_ENCOUNTER_FEE_CODE, {
      referenceType: REFERENCE_TYPES.PHARMACY_ENCOUNTER_FEE,
      category: INVOICE_ITEMS_CATEGORIES.PHARMACY_ENCOUNTER_FEE,
    });

    // Encounters created in this department are treated as walk-in pharmacy dispensing.
    await models.Setting.set(
      'medications.medicationDispensing.automaticEncounterDepartmentId',
      pharmacyDepartment.id,
      SETTINGS_SCOPES.FACILITY,
      facility.id,
    );
    settingsCache.reset();

    facilityPriceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'Encounter fee facility list',
        code: 'ENC-FEE-FACILITY',
        rules: { facilityId: facility.id },
      }),
    );
    await priceListItem(facilityPriceList.id, standardProduct.id);
    await priceListItem(facilityPriceList.id, edProduct.id, { price: 80 });
    await priceListItem(facilityPriceList.id, edAfterHoursProduct.id, { price: 120 });
    await priceListItem(facilityPriceList.id, edWeekendProduct.id, { price: 150 });
  });

  afterAll(() => ctx.close());

  it('adds the standard-hours fee to a weekday clinic encounter', async () => {
    const items = await addFeeFor({ encounterType: ENCOUNTER_TYPES.CLINIC });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(standardProduct.id);
  });

  it('adds the ED standard-hours fee to a weekday in-hours triage encounter', async () => {
    const items = await addFeeFor({ encounterType: ENCOUNTER_TYPES.TRIAGE });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(edProduct.id);
  });

  it('buckets an emergency-family encounter by time of day, using the emergency hours', async () => {
    const afterHours = await addFeeFor({
      encounterType: ENCOUNTER_TYPES.TRIAGE,
      startDate: '2024-06-18 18:30:00', // Tuesday evening → ED after-hours
    });
    expect(afterHours).toHaveLength(1);
    expect(afterHours[0].productId).toBe(edAfterHoursProduct.id);

    const weekend = await addFeeFor({
      encounterType: ENCOUNTER_TYPES.OBSERVATION,
      startDate: '2024-06-22 11:00:00', // Saturday → ED weekend
    });
    expect(weekend).toHaveLength(1);
    expect(weekend[0].productId).toBe(edWeekendProduct.id);
  });

  it('falls back to the after-hours fee (at its price) for a weekend encounter with no weekend product', async () => {
    // The clinic family has no weekend product configured here, only an after-hours one, so a
    // weekend encounter falls back to the after-hours product — and the line carries its price.
    const clinicAfterHoursProduct = await createFeeProduct(ENCOUNTER_FEE_CODES.AFTER_HOURS);
    await priceListItem(facilityPriceList.id, clinicAfterHoursProduct.id, { price: 90 });

    const { encounter, invoice } = await createEncounterWithInvoice({
      encounterType: ENCOUNTER_TYPES.CLINIC,
      startDate: '2024-06-22 11:00:00', // Saturday → clinic weekend → falls back to after-hours
    });
    await models.Invoice.addEncounterFee(encounter, settings, primaryTimeZone);

    const invoicePriceListId = await models.InvoicePriceList.getIdForPatientEncounter(encounter.id);
    const [line] = await models.InvoiceItem.findAll({
      where: { invoiceId: invoice.id },
      include: [
        {
          model: models.InvoiceProduct,
          as: 'product',
          include: [
            {
              model: models.InvoicePriceListItem,
              as: 'invoicePriceListItem',
              where: { invoicePriceListId },
              required: false,
            },
          ],
        },
      ],
    });
    expect(line.productId).toBe(clinicAfterHoursProduct.id);
    expect(Number(line.product.invoicePriceListItem.price)).toBe(90);
  });

  it('does not add a clinic/ED fee that the facility has hidden on its price list', async () => {
    // A facility suppresses an otherwise-applicable fee by hiding that product on its price list.
    const clinicWeekendProduct = await createFeeProduct(ENCOUNTER_FEE_CODES.WEEKEND);
    await priceListItem(facilityPriceList.id, clinicWeekendProduct.id, { isHidden: true });

    const items = await addFeeFor({
      encounterType: ENCOUNTER_TYPES.CLINIC,
      startDate: '2024-06-22 11:00:00', // Saturday → clinic weekend → resolves the hidden product
    });
    expect(items).toHaveLength(0);
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

  it('charges the standard clinic fee, not the pharmacy fee, for a clinic-department encounter', async () => {
    const items = await addFeeFor({ departmentId: generalDepartment.id });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(standardProduct.id);
  });

  it('does not charge a pharmacy encounter when the pharmacy product is unpriced', async () => {
    // No price-list item for the pharmacy product → charging is opt-in, so no line.
    const items = await addFeeFor({ departmentId: pharmacyDepartment.id });
    expect(items).toHaveLength(0);
  });

  it('charges the pharmacy fee for a pharmacy-department encounter once the product is priced', async () => {
    await priceListItem(facilityPriceList.id, pharmacyProduct.id, { price: 5 });

    const items = await addFeeFor({ departmentId: pharmacyDepartment.id });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(pharmacyProduct.id);
  });
});
